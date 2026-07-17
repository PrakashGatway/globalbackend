const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Application = require('../models/Application');
const VisaProcessing = require('../models/VisaProsesing');
const Communication = require('../models/Communication');
const { protect } = require('../middleware/auth');
const Course = require('../models/Course');

const STUDY_ABROAD_JOURNEY_STEPS = [
    {
        id: 1,
        label: 'Profile',
        key: 'profile_completed',
        description: 'Basic Info',
        route: '/dashboard/settings',
        icon: 'user',
        minimumRequirement: '60% profile completion',
        critical: true,
        impactOnDelay: 'Delays in profile completion will affect all subsequent steps including university shortlisting and applications'
    },
    {
        id: 2,
        label: 'Countries',
        key: 'country_shortlisted',
        description: 'Destinations',
        route: '/dashboard/countries',
        icon: 'flag',
        minimumRequirement: 'At least 1 preferred country',
        critical: true,
        impactOnDelay: 'Without country selection, you cannot proceed with course selection and university applications'
    },
    {
        id: 3,
        label: 'Courses',
        key: 'course_shortlisted',
        description: 'Programs',
        route: '/dashboard/settings',
        icon: 'book',
        minimumRequirement: 'At least 1 preferred course',
        critical: true,
        impactOnDelay: 'Course selection is mandatory before submitting university applications'
    },
    {
        id: 4,
        label: 'Universities',
        key: 'university_applications',
        description: 'Shortlist',
        route: '/dashboard/application',
        icon: 'file-text',
        minimumRequirement: 'At least 1 application submitted',
        critical: true,
        impactOnDelay: 'Without applications, you cannot receive offer letters or proceed with visa processing'
    },
    {
        id: 5,
        label: 'Offer Letter',
        key: 'offer_letter',
        description: 'Acceptance',
        route: '/dashboard/application',
        icon: 'award',
        minimumRequirement: 'Offer received status',
        critical: true,
        impactOnDelay: 'Offer letter is required for visa application and enrollment deposit payment'
    },
    {
        id: 6,
        label: 'Visa',
        key: 'visa_process',
        description: 'Processing',
        route: '/dashboard/visa',
        icon: 'passport',
        minimumRequirement: 'Visa application submitted',
        critical: true,
        impactOnDelay: 'Visa is mandatory for international travel and study. Delays can affect your intake enrollment'
    },
    {
        id: 7,
        label: 'Forex & Finance',
        key: 'forex_finance',
        description: 'financial arrangements',
        // route: '/dashboard/finance',
        icon: 'dollar-sign',
        minimumRequirement: 'Finance setup completed',
        critical: false,
        impactOnDelay: 'Financial arrangements are important for tuition fee payment and living expenses abroad'
    },
    {
        id: 8,
        label: 'Accommodation',
        key: 'accommodation',
        description: 'Housing',
        route: '/dashboard/accommodation',
        icon: 'home',
        minimumRequirement: 'Accommodation booked',
        critical: false,
        impactOnDelay: 'Delaying accommodation booking may result in limited options or higher costs'
    },
    {
        id: 9,
        label: 'Pre-Departure',
        key: 'pre_departure',
        description: 'Final Prep',
        // route: '/pre-departure',
        icon: 'plane',
        minimumRequirement: 'Ready to travel',
        critical: false,
        impactOnDelay: 'Pre-departure preparation ensures smooth transition to your study destination'
    }
];

// Alert severity levels
const ALERT_SEVERITY = {
    CRITICAL: 'critical',
    WARNING: 'warning',
    INFO: 'info',
    SUCCESS: 'success'
};

// Alert types
const ALERT_TYPE = {
    MISSING_STEP: 'missing_step',
    INCOMPLETE_STEP: 'incomplete_step',
    DOCUMENT_ISSUE: 'document_issue',
    DEADLINE_APPROACHING: 'deadline_approaching',
    APPLICATION_STATUS: 'application_status',
    VISA_ISSUE: 'visa_issue',
    PAYMENT_REQUIRED: 'payment_required'
};

function determineJourneyStepStatus(stepKey, userProfile, applications, visaProcessings) {
    switch (stepKey) {
        case 'profile_completed':
            if (!userProfile) return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['Profile not created']
            };
            const completion = userProfile.profileCompletion || 0;
            if (completion >= 60) return { status: 'Completed', completed: true };
            if (completion > 0) return { 
                status: 'In Progress', 
                completed: false,
                missingData: [`Profile is ${completion}% complete. Need ${60 - completion}% more to complete`]
            };
            return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['Profile not started. Please complete your profile to proceed']
            };

        case 'country_shortlisted':
            if (!userProfile || !userProfile.preferences) return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['Preferences not set']
            };
            const preferredCountries = userProfile.preferences.preferredCountries || [];
            if (preferredCountries.length > 0) return { status: 'Completed', completed: true };
            return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['No country selected. Please select at least 1 preferred country']
            };

        case 'course_shortlisted':
            if (!userProfile || !userProfile.preferences) return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['Preferences not set']
            };
            const preferredCourse = userProfile.preferences.preferredCourse || [];
            if (preferredCourse.length > 0) return { status: 'Completed', completed: true };
            return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['No course selected. Please select at least 1 preferred course']
            };

        case 'university_applications':
            if (!applications || applications.length === 0) return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['No applications submitted. Please submit at least 1 university application']
            };
            if (applications.length >= 1) return { status: 'Completed', completed: true };
            return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['No applications found']
            };

        case 'offer_letter':
            if (!applications || applications.length === 0) return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['No applications to receive offers']
            };
            const hasOfferReceived = applications.some(app => 
                app.primaryStatus === 'OfferReceived' || 
                app.primaryStatus === 'PayEnrollenmentDeposit' || 
                app.primaryStatus === 'Completed'
            );
            if (hasOfferReceived) return { status: 'Completed', completed: true };
            
            const hasActiveApp = applications.some(app =>
                ['Started', 'ReviewbyOoshas', 'SubmitToSchool', 'AwaitingSchoolResponse', 'AdmissionProcessing'].includes(app.primaryStatus)
            );
            if (hasActiveApp) return { 
                status: 'In Progress', 
                completed: false,
                missingData: ['Applications are under review. Waiting for university response']
            };
            
            const hasRefused = applications.every(app => app.primaryStatus === 'Refused');
            if (hasRefused) return {
                status: 'In Progress',
                completed: false,
                missingData: ['All applications were refused. Please apply to backup courses']
            };
            
            return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['No offer received yet']
            };

        case 'visa_process':
            if (!visaProcessings || visaProcessings.length === 0) return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['Visa application not started. Offer letter required first']
            };
            
            const activeVisa = visaProcessings[0];
            if (!activeVisa) return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['No active visa application']
            };
            
            const hasApprovedVisa = activeVisa.documents?.some(doc => doc.status === 'verified');
            const allDocsVerified = activeVisa.documents?.every(doc => doc.status === 'verified');
            const hasRejectedDocs = activeVisa.documents?.some(doc => doc.status === 'rejected');
            
            if (allDocsVerified || (hasApprovedVisa && activeVisa.currentStep >= 5)) {
                return { status: 'Completed', completed: true };
            }
            
            if (hasRejectedDocs) {
                const rejectedDocs = activeVisa.documents.filter(doc => doc.status === 'rejected');
                return {
                    status: 'In Progress',
                    completed: false,
                    missingData: [`${rejectedDocs.length} document(s) rejected. Please re-upload: ${rejectedDocs.map(d => d.documentType).join(', ')}`]
                };
            }
            
            if (activeVisa.currentStep > 0 || activeVisa.documents?.length > 0) {
                const pendingDocs = activeVisa.documents?.filter(doc => doc.status === 'pending');
                if (pendingDocs && pendingDocs.length > 0) {
                    return {
                        status: 'In Progress',
                        completed: false,
                        missingData: [`${pendingDocs.length} document(s) pending upload: ${pendingDocs.map(d => d.documentType).join(', ')}`]
                    };
                }
                return { status: 'In Progress', completed: false };
            }
            
            return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['Visa application not initiated']
            };

        case 'forex_finance':
            if (!userProfile) return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['Profile not found']
            };
            
            const visaCompleted = visaProcessings?.some(visa =>
                visa.documents?.every(doc => doc.status === 'verified')
            );
            
            if (visaCompleted) {
                return { 
                    status: 'In Progress', 
                    completed: false,
                    missingData: ['Finance setup required. Please complete forex and financial arrangements']
                };
            }
            
            return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['Visa must be approved before proceeding with finance setup']
            };

        case 'accommodation':
            if (!userProfile) return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['Profile not found']
            };
            
            const visaApproved = visaProcessings?.some(visa =>
                visa.documents?.every(doc => doc.status === 'verified')
            );
            
            if (visaApproved) {
                return { 
                    status: 'In Progress', 
                    completed: false,
                    missingData: ['Accommodation not booked. Please secure your accommodation']
                };
            }
            
            return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['Visa must be approved before booking accommodation']
            };

        case 'pre_departure':
            const hasVisaApproved = visaProcessings?.some(visa =>
                visa.documents?.every(doc => doc.status === 'verified')
            );
            const hasOffer = applications?.some(app =>
                app.primaryStatus === 'OfferReceived' || 
                app.primaryStatus === 'PayEnrollenmentDeposit' || 
                app.primaryStatus === 'Completed'
            );
            
            if (hasVisaApproved && hasOffer) {
                return { 
                    status: 'In Progress', 
                    completed: false,
                    missingData: ['Pre-departure checklist not completed']
                };
            }
            
            return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['Visa approval and offer letter required before pre-departure']
            };

        default:
            return { 
                status: 'Upcoming', 
                completed: false,
                missingData: ['Unknown step']
            };
    }
}

function generateAlerts(journeySteps, applications, visaProcessings, userProfile, documentStats) {
    const alerts = [];
    const criticalSteps = journeySteps.filter(step => step.critical);

    // Check for critical incomplete steps
    criticalSteps.forEach(step => {
        if (!step.completed && step.status === 'Upcoming') {
            alerts.push({
                id: `alert_${step.id}_missing`,
                type: ALERT_TYPE.MISSING_STEP,
                severity: ALERT_SEVERITY.CRITICAL,
                title: `${step.label} - Missing`,
                message: step.missingData?.[0] || `${step.label} has not been started`,
                impact: step.impactOnDelay,
                step: {
                    id: step.id,
                    label: step.label,
                    route: step.route
                },
                action: {
                    label: `Complete ${step.label}`,
                    route: step.route,
                    type: 'primary'
                },
                timestamp: new Date().toISOString()
            });
        } else if (!step.completed && step.status === 'In Progress') {
            alerts.push({
                id: `alert_${step.id}_incomplete`,
                type: ALERT_TYPE.INCOMPLETE_STEP,
                severity: ALERT_SEVERITY.WARNING,
                title: `${step.label} - In Progress`,
                message: step.missingData?.[0] || `${step.label} needs attention`,
                impact: step.impactOnDelay,
                step: {
                    id: step.id,
                    label: step.label,
                    route: step.route
                },
                action: {
                    label: `Complete ${step.label}`,
                    route: step.route,
                    type: 'warning'
                },
                timestamp: new Date().toISOString()
            });
        }
    });

    // Check for refused applications
    const refusedApplications = applications?.filter(app => app.primaryStatus === 'Refused') || [];
    if (refusedApplications.length > 0) {
        alerts.push({
            id: 'alert_refused_applications',
            type: ALERT_TYPE.APPLICATION_STATUS,
            severity: ALERT_SEVERITY.CRITICAL,
            title: 'Applications Refused',
            message: `${refusedApplications.length} application(s) have been refused. Immediate action required.`,
            impact: 'Refused applications will delay your study abroad journey. You need to apply to backup courses or new applications.',
            details: refusedApplications.map(app => ({
                applicationNumber: app.applicationNumber,
                country: app.country,
                reason: app.rejectionReason || 'No reason provided'
            })),
            action: {
                label: 'Apply to Backup Courses',
                route: '/applications/new',
                type: 'critical'
            },
            timestamp: new Date().toISOString()
        });
    }

    // Check for rejected visa documents
    const activeVisa = visaProcessings?.[0];
    if (activeVisa) {
        const rejectedDocs = activeVisa.documents?.filter(doc => doc.status === 'rejected') || [];
        if (rejectedDocs.length > 0) {
            alerts.push({
                id: 'alert_visa_documents_rejected',
                type: ALERT_TYPE.VISA_ISSUE,
                severity: ALERT_SEVERITY.CRITICAL,
                title: 'Visa Documents Rejected',
                message: `${rejectedDocs.length} visa document(s) rejected. Please re-upload immediately.`,
                impact: 'Rejected visa documents can delay your visa processing and affect your intake enrollment.',
                details: rejectedDocs.map(doc => ({
                    documentType: doc.documentType,
                    reason: doc.rejectionReason || 'No reason provided'
                })),
                action: {
                    label: 'Re-upload Documents',
                    route: '/visa/documents',
                    type: 'critical'
                },
                timestamp: new Date().toISOString()
            });
        }

        // Check for pending visa documents
        const pendingDocs = activeVisa.documents?.filter(doc => doc.status === 'pending') || [];
        if (pendingDocs.length > 0) {
            alerts.push({
                id: 'alert_visa_documents_pending',
                type: ALERT_TYPE.DOCUMENT_ISSUE,
                severity: ALERT_SEVERITY.WARNING,
                title: 'Visa Documents Pending',
                message: `${pendingDocs.length} visa document(s) pending upload.`,
                impact: 'Pending documents will delay your visa processing timeline.',
                details: pendingDocs.map(doc => ({
                    documentType: doc.documentType,
                    description: doc.description
                })),
                action: {
                    label: 'Upload Documents',
                    route: '/visa/documents/upload',
                    type: 'warning'
                },
                timestamp: new Date().toISOString()
            });
        }
    }

    // Check for payment pending
    const pendingPaymentApps = applications?.filter(app => 
        app.paymentStatus === 'Pending' && 
        app.primaryStatus === 'PayEnrollenmentDeposit'
    ) || [];
    
    if (pendingPaymentApps.length > 0) {
        alerts.push({
            id: 'alert_payment_pending',
            type: ALERT_TYPE.PAYMENT_REQUIRED,
            severity: ALERT_SEVERITY.CRITICAL,
            title: 'Enrollment Deposit Pending',
            message: `${pendingPaymentApps.length} application(s) require enrollment deposit payment.`,
            impact: 'Failure to pay enrollment deposit may result in offer cancellation and affect your admission.',
            details: pendingPaymentApps.map(app => ({
                applicationNumber: app.applicationNumber,
                country: app.country
            })),
            action: {
                label: 'Pay Now',
                route: '/payments',
                type: 'critical'
            },
            timestamp: new Date().toISOString()
        });
    }

    // Check for documents pending verification
    if (documentStats.pending > 0) {
        alerts.push({
            id: 'alert_documents_pending',
            type: ALERT_TYPE.DOCUMENT_ISSUE,
            severity: ALERT_SEVERITY.WARNING,
            title: 'Documents Pending Review',
            message: `${documentStats.pending} document(s) are under review.`,
            impact: 'Documents under review may be required for application submission or visa processing.',
            action: {
                label: 'View Documents',
                route: '/documents',
                type: 'info'
            },
            timestamp: new Date().toISOString()
        });
    }

    // Check for rejected documents
    if (documentStats.rejected > 0) {
        alerts.push({
            id: 'alert_documents_rejected',
            type: ALERT_TYPE.DOCUMENT_ISSUE,
            severity: ALERT_SEVERITY.CRITICAL,
            title: 'Documents Rejected',
            message: `${documentStats.rejected} document(s) rejected. Please re-upload with corrections.`,
            impact: 'Rejected documents will halt your application and visa processing.',
            action: {
                label: 'Re-upload Documents',
                route: '/documents/upload',
                type: 'critical'
            },
            timestamp: new Date().toISOString()
        });
    }

    // Sort alerts by severity (critical first)
    return alerts.sort((a, b) => {
        const severityOrder = {
            [ALERT_SEVERITY.CRITICAL]: 0,
            [ALERT_SEVERITY.WARNING]: 1,
            [ALERT_SEVERITY.INFO]: 2,
            [ALERT_SEVERITY.SUCCESS]: 3
        };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });
}

function calculateJourneyProgress(journeySteps) {
    const totalSteps = journeySteps.length;
    const completedSteps = journeySteps.filter(step => step.completed).length;
    const inProgressSteps = journeySteps.filter(step => 
        step.status === 'In Progress'
    ).length;

    const completedWeight = completedSteps * 100;
    const inProgressWeight = inProgressSteps * 50;
    const totalWeight = totalSteps * 100;
    
    return Math.round((completedWeight + inProgressWeight) / totalWeight * 100);
}

// GET /api/dashboard
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Fetch all user data in parallel
        const [user, userProfile, applications, visaProcessings, recentActivities] = await Promise.all([
            User.findById(userId).select('-password'),
            UserProfile.findOne({ user: userId }),
            Application.find({ student: userId })
                .populate('course', 'name university country')
                .sort({ createdAt: -1 }),
            VisaProcessing.find({ userId: userId })
                .sort({ createdAt: -1 }),
            Communication.find({ user: userId })
                .populate('application', 'applicationNumber')
                .sort({ createdAt: -1 })
                .limit(20)
        ]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Document Stats
        const documentStats = {
            total: 0,
            pending: 0,
            verified: 0,
            rejected: 0
        };

        if (userProfile && userProfile.documents) {
            try {
                const documents = typeof userProfile.documents === 'string'
                    ? JSON.parse(userProfile.documents)
                    : userProfile.documents;

                const documentsArray = Array.isArray(documents) ? documents : Object.values(documents);

                if (documentsArray.length > 0) {
                    documentStats.total = documentsArray.length;
                    documentsArray.forEach(doc => {
                        switch (doc.status?.toLowerCase()) {
                            case 'approved':
                            case 'verified':
                                documentStats.verified++;
                                break;
                            case 'pending':
                            case 'inreview':
                                documentStats.pending++;
                                break;
                            case 'rejected':
                                documentStats.rejected++;
                                break;
                        }
                    });
                }
            } catch (error) {
                console.error('Error parsing documents:', error);
            }
        }

        // Build Journey Steps with detailed status
        const journeySteps = STUDY_ABROAD_JOURNEY_STEPS.map((step, index) => {
            const stepResult = determineJourneyStepStatus(
                step.key,
                userProfile,
                applications,
                visaProcessings
            );

            let locked = false;
            if (index > 0) {
                const prevStepStatus = determineJourneyStepStatus(
                    STUDY_ABROAD_JOURNEY_STEPS[index - 1].key,
                    userProfile,
                    applications,
                    visaProcessings
                );
                locked = !prevStepStatus.completed;
            }

            return {
                id: step.id,
                label: step.label,
                description: step.description,
                route: step.route,
                icon: step.icon,
                status: stepResult.status,
                completed: stepResult.completed,
                locked: locked,
                critical: step.critical,
                minimumRequirement: step.minimumRequirement,
                impactOnDelay: step.impactOnDelay,
                missingData: stepResult.missingData || [],
                isCurrentStep: stepResult.status === 'In Progress' && !locked,
                progress: stepResult.status === 'Completed' ? 100 : stepResult.status === 'In Progress' ? 50 : 0
            };
        });

        const overallProgress = calculateJourneyProgress(journeySteps);

        // Find current active step
        const currentActiveStep = journeySteps.find(step => 
            step.status === 'In Progress' && !step.locked
        );

        // Find next upcoming step
        const nextStep = journeySteps.find(step => 
            step.status === 'Upcoming' && !step.locked
        );

        // Generate Alerts
        const alerts = generateAlerts(journeySteps, applications, visaProcessings, userProfile, documentStats);

        // FIXED: Define criticalSteps properly
        const criticalSteps = journeySteps.filter(step => step.critical);
        const criticalStepsPending = criticalSteps.filter(s => !s.completed).length;

        // Universities Applied Count
        const universitiesApplied = {
            total: applications.length,
            active: applications.filter(app =>
                !['Completed', 'Refused'].includes(app.primaryStatus)
            ).length,
            offers: applications.filter(app =>
                app.primaryStatus === 'OfferReceived'
            ).length,
            refused: applications.filter(app =>
                app.primaryStatus === 'Refused'
            ).length,
            completed: applications.filter(app =>
                app.primaryStatus === 'Completed'
            ).length,
            byCountry: {}
        };

        applications.forEach(app => {
            if (!universitiesApplied.byCountry[app.country]) {
                universitiesApplied.byCountry[app.country] = {
                    total: 0,
                    active: 0,
                    offers: 0,
                    refused: 0
                };
            }
            universitiesApplied.byCountry[app.country].total++;
            if (app.primaryStatus === 'OfferReceived') {
                universitiesApplied.byCountry[app.country].offers++;
            }
            if (app.primaryStatus === 'Refused') {
                universitiesApplied.byCountry[app.country].refused++;
            }
            if (!['Completed', 'Refused'].includes(app.primaryStatus)) {
                universitiesApplied.byCountry[app.country].active++;
            }
        });

        // Visa Application Status
        const visaStatus = {
            total: visaProcessings.length,
            active: visaProcessings.filter(v => v.currentStep > 0).length,
            byCountry: {},
            currentVisa: null
        };

        if (visaProcessings.length > 0) {
            const latestVisa = visaProcessings[0];
            visaStatus.currentVisa = {
                applicationId: latestVisa.applicationId,
                country: latestVisa.country,
                currentStep: latestVisa.currentStep,
                documentStatus: {
                    total: latestVisa.documents?.length || 0,
                    pending: latestVisa.documents?.filter(d => d.status === 'pending').length || 0,
                    uploaded: latestVisa.documents?.filter(d => d.status === 'uploaded').length || 0,
                    verified: latestVisa.documents?.filter(d => d.status === 'verified').length || 0,
                    rejected: latestVisa.documents?.filter(d => d.status === 'rejected').length || 0
                },
                lastUpdated: latestVisa.updatedAt
            };
        }

        visaProcessings.forEach(visa => {
            if (!visaStatus.byCountry[visa.country]) {
                visaStatus.byCountry[visa.country] = {
                    total: 0,
                    approved: 0,
                    processing: 0
                };
            }
            visaStatus.byCountry[visa.country].total++;

            const hasApproved = visa.documents?.every(d => d.status === 'verified');
            if (hasApproved) {
                visaStatus.byCountry[visa.country].approved++;
            } else if (visa.currentStep > 0) {
                visaStatus.byCountry[visa.country].processing++;
            }
        });

        // Applications Summary
        const applicationsSummary = applications.map(app => ({
            id: app._id,
            applicationNumber: app.applicationNumber,
            country: app.country,
            course: app.course ? {
                id: app.course._id,
                name: app.course.name,
                university: app.course.university
            } : null,
            intake: app.intake,
            primaryStatus: app.primaryStatus,
            paymentStatus: app.paymentStatus,
            isVisa: app.isVisa,
            hasIssues: app.primaryStatus === 'Refused' || 
                      (app.primaryStatus === 'PayEnrollenmentDeposit' && app.paymentStatus === 'Pending'),
            createdAt: app.createdAt,
            updatedAt: app.updatedAt,
            statusDetails: app.statusDetails
        }));

        // Recent Activities
        const recentActivitiesList = recentActivities.map(activity => ({
            id: activity._id,
            type: activity.type,
            action: activity.action,
            description: activity.description,
            content: activity.content,
            application: activity.application ? {
                id: activity.application._id,
                applicationNumber: activity.application.applicationNumber
            } : null,
            isRead: activity.isRead,
            createdAt: activity.createdAt,
            userType: activity.userType
        }));

        const unreadCount = await Communication.countDocuments({ 
            user: userId, 
            isRead: false 
        });

        // Critical issues summary
        const criticalAlerts = alerts.filter(alert => alert.severity === ALERT_SEVERITY.CRITICAL);
        const warningAlerts = alerts.filter(alert => alert.severity === ALERT_SEVERITY.WARNING);

        const dashboardData = {
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    profileImage: user.profileImage,
                    profileCompletion: userProfile ? userProfile.profileCompletion : 0,
                    status: user.status,
                    lastLogin: user.lastLogin
                },
                studyAbroadJourney: {
                    steps: journeySteps,
                    overallProgress: overallProgress,
                    currentActiveStep: currentActiveStep || null,
                    nextStep: nextStep || null,
                    totalSteps: STUDY_ABROAD_JOURNEY_STEPS.length,
                    completedSteps: journeySteps.filter(s => s.completed).length,
                    criticalStepsPending: criticalStepsPending  // FIXED: Using the properly defined variable
                },
                alerts: {
                    total: alerts.length,
                    critical: criticalAlerts.length,
                    warning: warningAlerts.length,
                    list: alerts,
                    summary: criticalAlerts.length > 0 
                        ? `You have ${criticalAlerts.length} critical issue(s) that require immediate attention`
                        : warningAlerts.length > 0
                        ? `You have ${warningAlerts.length} warning(s) that need attention`
                        : 'All systems are good. Keep progressing!'
                },
                statistics: {
                    documents: documentStats,
                    universitiesApplied: universitiesApplied,
                    visaStatus: visaStatus,
                    unreadActivities: unreadCount
                },
                applications: applicationsSummary,
                recentActivities: recentActivitiesList,
                quickActions: generateQuickActions(journeySteps, alerts)
            },
            timestamp: new Date().toISOString()
        };

        res.status(200).json(dashboardData);

    } catch (error) {
        console.error('Dashboard API Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
});

function generateQuickActions(journeySteps, alerts) {
    const actions = [];

    // Add critical actions from alerts first
    const criticalAlerts = alerts.filter(alert => alert.severity === ALERT_SEVERITY.CRITICAL);
    criticalAlerts.slice(0, 2).forEach(alert => {
        actions.push({
            label: alert.action.label,
            route: alert.action.route,
            priority: 'critical',
            type: 'danger',
            alertId: alert.id,
            reason: alert.title
        });
    });

    // Find current active step
    const activeStep = journeySteps.find(step => 
        step.status === 'In Progress' && !step.locked
    );

    if (activeStep) {
        const actionMap = {
            1: { label: 'Complete Profile', route: '/profile/edit', priority: 'high', type: 'primary' },
            2: { label: 'Select Countries', route: '/preferences/countries', priority: 'high', type: 'primary' },
            3: { label: 'Browse Courses', route: '/courses', priority: 'high', type: 'primary' },
            4: { label: 'Submit Application', route: '/applications/new', priority: 'high', type: 'primary' },
            5: { label: 'View Offers', route: '/applications/offers', priority: 'high', type: 'primary' },
            6: { label: 'Track Visa', route: '/visa/track', priority: 'high', type: 'primary' },
            7: { label: 'Setup Finance', route: '/finance', priority: 'high', type: 'primary' },
            8: { label: 'Book Accommodation', route: '/accommodation', priority: 'high', type: 'primary' },
            9: { label: 'Pre-Departure Checklist', route: '/pre-departure', priority: 'high', type: 'primary' }
        };

        if (actionMap[activeStep.id]) {
            actions.push(actionMap[activeStep.id]);
        }
    }

    // Find next upcoming step if no active step
    const nextStep = journeySteps.find(step => 
        step.status === 'Upcoming' && !step.locked
    );

    if (nextStep && !activeStep) {
        actions.push({ 
            label: `Start: ${nextStep.label}`, 
            route: nextStep.route, 
            priority: 'medium',
            type: 'secondary'
        });
    }

    // Add common actions
    actions.push({ 
        label: 'View All Applications', 
        route: '/applications', 
        priority: 'normal',
        type: 'outline'
    });
    
    actions.push({ 
        label: 'Contact Support', 
        route: '/support', 
        priority: 'normal',
        type: 'outline'
    });

    return actions;
}

// Get paginated activities
router.get('/activities', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, type } = req.query;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const query = { user: userId };
        if (type) {
            query.type = type;
        }

        const activities = await Communication.find(query)
            .populate('application', 'applicationNumber')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Communication.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                activities: activities.map(activity => ({
                    id: activity._id,
                    type: activity.type,
                    action: activity.action,
                    description: activity.description,
                    content: activity.content,
                    application: activity.application ? {
                        id: activity.application._id,
                        applicationNumber: activity.application.applicationNumber
                    } : null,
                    isRead: activity.isRead,
                    createdAt: activity.createdAt,
                    userType: activity.userType
                })),
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: Number(limit)
                }
            }
        });

    } catch (error) {
        console.error('Activities API Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching activities',
            error: error.message
        });
    }
});

// Mark activities as read
router.put('/activities/read', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { activityIds } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        let updateQuery;
        if (activityIds && activityIds.length > 0) {
            updateQuery = {
                user: userId,
                _id: { $in: activityIds }
            };
        } else {
            updateQuery = {
                user: userId,
                isRead: false
            };
        }

        const result = await Communication.updateMany(updateQuery, {
            $set: { isRead: true }
        });

        res.status(200).json({
            success: true,
            data: {
                modifiedCount: result.modifiedCount,
                message: `${result.modifiedCount} activities marked as read`
            }
        });

    } catch (error) {
        console.error('Mark activities read Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking activities as read',
            error: error.message
        });
    }
});

module.exports = router;