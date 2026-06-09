// controllers/dashboardController.js
const User = require('../models/User');
const Support = require('../models/Support');
const Purchase = require('../models/Purchase');
const Application = require('../models/Application');
const mongoose = require('mongoose');
const VisaProcessing = require("../models/VisaProsesing");

// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const Communication = require('../models/Communication');

const getAdminDashboard = async (req, res) => {
    try {
        // Verify user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const currentDate = new Date();
        const startOfToday = new Date(currentDate.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

        // Execute all queries in parallel for better performance
        const [
            // User Statistics
            totalUsers,
            activeUsers,
            suspendedUsers,
            usersByRole,
            usersByStatus,
            newUsersToday,
            newUsersThisWeek,
            newUsersThisMonth,
            newUsersThisYear,

            // Support Statistics
            totalTickets,
            openTickets,
            pendingTickets,
            resolvedTickets,
            closedTickets,
            ticketsByPriority,
            newTicketsToday,
            newTicketsThisWeek,

            // Purchase Statistics
            totalRevenue,
            completedPurchases,
            pendingPurchases,
            refundedPurchases,
            todayRevenue,
            weekRevenue,
            monthRevenue,
            yearRevenue,
            revenueByPaymentMethod,

            // Application Statistics
            totalApplications,
            applicationsByStatus,
            pendingApplications,
            startedApplications,
            offerReceivedApplications,
            completedApplications,
            refusedApplications,
            withdrawnApplications,
            newApplicationsToday,
            newApplicationsThisWeek,
            applicationsByCountry,

            // Recent Data for Dashboard
            recentUsers,
            recentTickets,
            recentPurchases,
            recentApplications
        ] = await Promise.all([
            // User aggregations
            User.countDocuments(),
            User.countDocuments({ status: 'Active' }),
            User.countDocuments({ status: 'Suspended' }),
            User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } },
                { $project: { role: '$_id', count: 1, _id: 0 } }
            ]),
            User.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $project: { status: '$_id', count: 1, _id: 0 } }
            ]),
            User.countDocuments({ createdAt: { $gte: startOfToday } }),
            User.countDocuments({ createdAt: { $gte: startOfWeek } }),
            User.countDocuments({ createdAt: { $gte: startOfMonth } }),
            User.countDocuments({ createdAt: { $gte: startOfYear } }),

            // Support aggregations
            Support.countDocuments(),
            Support.countDocuments({ status: 'open' }),
            Support.countDocuments({ status: 'pending' }),
            Support.countDocuments({ status: 'resolved' }),
            Support.countDocuments({ status: 'closed' }),
            Support.aggregate([
                { $group: { _id: '$priority', count: { $sum: 1 } } }
            ]),
            Support.countDocuments({ createdAt: { $gte: startOfToday } }),
            Support.countDocuments({ createdAt: { $gte: startOfWeek } }),

            // Purchase aggregations
            Purchase.aggregate([
                { $match: { status: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Purchase.countDocuments({ status: 'Completed' }),
            Purchase.countDocuments({ status: 'Pending' }),
            Purchase.countDocuments({ status: 'Refunded' }),
            Purchase.aggregate([
                { $match: { status: 'Completed', createdAt: { $gte: startOfToday } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Purchase.aggregate([
                { $match: { status: 'Completed', createdAt: { $gte: startOfWeek } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Purchase.aggregate([
                { $match: { status: 'Completed', createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Purchase.aggregate([
                { $match: { status: 'Completed', createdAt: { $gte: startOfYear } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Purchase.aggregate([
                { $match: { status: 'Completed' } },
                { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),

            // Application aggregations
            Application.countDocuments(),
            Application.aggregate([
                { $group: { _id: '$primaryStatus', count: { $sum: 1 } } }
            ]),
            Application.countDocuments({ primaryStatus: 'Pending' }),
            Application.countDocuments({ primaryStatus: 'Started' }),
            Application.countDocuments({ primaryStatus: 'OfferReceived' }),
            Application.countDocuments({ primaryStatus: 'Completed' }),
            Application.countDocuments({ primaryStatus: 'Refused' }),
            Application.countDocuments({ isWithdrawn: true }),
            Application.countDocuments({ createdAt: { $gte: startOfToday } }),
            Application.countDocuments({ createdAt: { $gte: startOfWeek } }),
            Application.aggregate([
                { $group: { _id: '$country', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            // Recent data
            User.find().sort({ createdAt: -1 }).limit(10).select('name email role status createdAt'),
            Support.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email'),
            Purchase.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email'),
            Application.find().sort({ createdAt: -1 }).limit(10).populate('student', 'name email').populate('course', 'name')
        ]);

        // Format user role data
        const roleStats = {
            admin: 0,
            manager: 0,
            counsellor: 0,
            user: 0
        };
        usersByRole.forEach(item => {
            if (roleStats.hasOwnProperty(item.role)) {
                roleStats[item.role] = item.count;
            }
        });

        // Format status data
        const statusStats = {};
        usersByStatus.forEach(item => {
            statusStats[item.status] = item.count;
        });

        // Format priority data
        const priorityStats = {
            Low: 0,
            Medium: 0,
            High: 0,
            Urgent: 0
        };
        ticketsByPriority.forEach(item => {
            if (priorityStats.hasOwnProperty(item._id)) {
                priorityStats[item._id] = item.count;
            }
        });

        // Format application status data
        const applicationStatusStats = {};
        applicationsByStatus.forEach(item => {
            applicationStatusStats[item._id] = item.count;
        });

        // Format revenue by payment method
        const paymentMethodStats = revenueByPaymentMethod.map(item => ({
            method: item._id || 'Other',
            total: item.total || 0,
            count: item.count
        }));

        const dashboardData = {
            success: true,
            data: {
                // User Statistics
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    suspended: suspendedUsers,
                    byRole: roleStats,
                    byStatus: statusStats,
                    newUsers: {
                        today: newUsersToday,
                        thisWeek: newUsersThisWeek,
                        thisMonth: newUsersThisMonth,
                        thisYear: newUsersThisYear
                    }
                },

                // Support Statistics
                support: {
                    totalTickets,
                    open: openTickets,
                    pending: pendingTickets,
                    resolved: resolvedTickets,
                    closed: closedTickets,
                    byPriority: priorityStats,
                    newTickets: {
                        today: newTicketsToday,
                        thisWeek: newTicketsThisWeek
                    }
                },

                // Revenue Statistics
                revenue: {
                    total: totalRevenue[0]?.total || 0,
                    today: todayRevenue[0]?.total || 0,
                    thisWeek: weekRevenue[0]?.total || 0,
                    thisMonth: monthRevenue[0]?.total || 0,
                    thisYear: yearRevenue[0]?.total || 0,
                    byPaymentMethod: paymentMethodStats
                },

                // Purchase Statistics
                purchases: {
                    completed: completedPurchases,
                    pending: pendingPurchases,
                    refunded: refundedPurchases
                },

                // Application Statistics
                applications: {
                    total: totalApplications,
                    byStatus: applicationStatusStats,
                    pending: pendingApplications,
                    started: startedApplications,
                    offerReceived: offerReceivedApplications,
                    completed: completedApplications,
                    refused: refusedApplications,
                    withdrawn: withdrawnApplications,
                    newApplications: {
                        today: newApplicationsToday,
                        thisWeek: newApplicationsThisWeek
                    },
                    topCountries: applicationsByCountry
                },

                // Recent Activity
                recent: {
                    users: recentUsers,
                    tickets: recentTickets,
                    purchases: recentPurchases,
                    applications: recentApplications
                },

                // Performance Metrics
                metrics: {
                    conversionRate: totalUsers > 0 ? (completedApplications / totalUsers * 100).toFixed(2) : 0,
                    supportResolutionRate: totalTickets > 0 ? ((resolvedTickets + closedTickets) / totalTickets * 100).toFixed(2) : 0,
                    averageTicketResponseTime: 'Coming Soon', // Would require additional tracking
                    userEngagementRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0
                }
            }
        };

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching admin dashboard data',
            error: error.message
        });
    }
};


const getCounsellorDashboard = async (req, res) => {
    try {
        if (req.user.role !== 'counsellor' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Counsellor privileges required.'
            });
        }

        const counsellorId = req.user._id;
        
        const currentDate = new Date();
        const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // 3. Fetch Assigned Users (Only fetch IDs to optimize memory and performance)
        const assignedUsers = await User.find({ assignto: counsellorId }).select('_id name email profileImage');
        const assignedUserIds = assignedUsers.map(u => u._id);
        const totalAssignedUsers = assignedUsers.length;

        // Edge Case: If counsellor has no users, return empty structure immediately to save DB resources
        if (totalAssignedUsers === 0) {
            return res.status(200).json({
                success: true,
                message: 'No assigned users found for this counsellor.',
                data: {
                    overview: { totalAssignedUsers: 0, activeUsers: 0, totalApplications: 0, totalRevenue: 0, openTickets: 0, unreadMessages: 0 },
                    users: { total: 0, active: 0, byStatus: {}, newUsers: { today: 0, thisWeek: 0, thisMonth: 0 }, activeLast7Days: 0 },
                    applications: { total: 0, byStatus: {}, rawStatusCounts: {}, topCountries: [], newApplications: { today: 0, thisWeek: 0, thisMonth: 0 }, recent: [] },
                    support: { total: 0, byStatus: {}, byPriority: {}, recent: [] },
                    visaProcessing: { total: 0, byCountry: {} },
                    communications: { total: 0, unread: 0, recent: [] },
                    revenue: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, completedPurchases: 0, recentPurchases: [] },
                    metrics: { applicationConversionRate: 0, offerRate: 0, completionRate: 0, supportResolutionRate: 0, activeUserRate: 0 }
                }
            });
        }

        // 4. Execute all queries in parallel
        const [
            // Users
            activeUsersCount, usersByStatus, newUsersToday, newUsersThisWeek, newUsersThisMonth, activeUsersLast7Days,
            // Applications
            totalApplicationsCount, applicationsByStatus, topApplicationCountries, newApplicationsToday, newApplicationsThisWeek, newApplicationsThisMonth, recentApplications,
            // Support
            totalTicketsCount, ticketsByStatus, ticketsByPriority, recentTickets,
            // Visa Processing
            totalVisaProcesses, visaByCountry,
            // Communications
            totalCommunications, unreadCommunications, recentCommunications,
            // Purchases
            totalRevenueAgg, totalCompletedPurchasesCount, todayRevenueAgg, weekRevenueAgg, monthRevenueAgg, recentPurchases
        ] = await Promise.all([
            // --- USERS ---
            User.countDocuments({ assignto: counsellorId, status: 'Active' }),
            User.aggregate([{ $match: { assignto: counsellorId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
            User.countDocuments({ assignto: counsellorId, createdAt: { $gte: startOfToday } }),
            User.countDocuments({ assignto: counsellorId, createdAt: { $gte: startOfWeek } }),
            User.countDocuments({ assignto: counsellorId, createdAt: { $gte: startOfMonth } }),
            User.countDocuments({ assignto: counsellorId, lastLogin: { $gte: last7Days } }),

            // --- APPLICATIONS ---
            Application.countDocuments({ student: { $in: assignedUserIds } }),
            Application.aggregate([{ $match: { student: { $in: assignedUserIds } } }, { $group: { _id: '$primaryStatus', count: { $sum: 1 } } }]),
            Application.aggregate([{ $match: { student: { $in: assignedUserIds } } }, { $group: { _id: '$country', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
            Application.countDocuments({ student: { $in: assignedUserIds }, createdAt: { $gte: startOfToday } }),
            Application.countDocuments({ student: { $in: assignedUserIds }, createdAt: { $gte: startOfWeek } }),
            Application.countDocuments({ student: { $in: assignedUserIds }, createdAt: { $gte: startOfMonth } }),
            Application.find({ student: { $in: assignedUserIds } }).sort({ createdAt: -1 }).limit(10)
                .populate('student', 'name email phone profileImage').populate('course', 'name university country'),

            // --- SUPPORT ---
            Support.countDocuments({ user: { $in: assignedUserIds } }),
            Support.aggregate([{ $match: { user: { $in: assignedUserIds } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
            Support.aggregate([{ $match: { user: { $in: assignedUserIds } } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
            Support.find({ user: { $in: assignedUserIds } }).sort({ createdAt: -1 }).limit(10)
                .populate('user', 'name email profileImage'),

            // --- VISA PROCESSING ---
            VisaProcessing.countDocuments({ userId: { $in: assignedUserIds } }),
            VisaProcessing.aggregate([{ $match: { userId: { $in: assignedUserIds } } }, { $group: { _id: '$country', count: { $sum: 1 } } }]),

            // --- COMMUNICATIONS ---
            Communication.countDocuments({ user: { $in: assignedUserIds } }),
            Communication.countDocuments({ user: { $in: assignedUserIds }, isRead: false }),
            Communication.find({ user: { $in: assignedUserIds } }).sort({ createdAt: -1 }).limit(10)
                .populate('user', 'name email profileImage').populate('application', 'applicationNumber primaryStatus'),

            // --- PURCHASES ---
            Purchase.aggregate([{ $match: { user: { $in: assignedUserIds }, status: 'Completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Purchase.countDocuments({ user: { $in: assignedUserIds }, status: 'Completed' }),
            Purchase.aggregate([{ $match: { user: { $in: assignedUserIds }, status: 'Completed', createdAt: { $gte: startOfToday } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Purchase.aggregate([{ $match: { user: { $in: assignedUserIds }, status: 'Completed', createdAt: { $gte: startOfWeek } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Purchase.aggregate([{ $match: { user: { $in: assignedUserIds }, status: 'Completed', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Purchase.find({ user: { $in: assignedUserIds } }).sort({ createdAt: -1 }).limit(10)
                .populate('user', 'name email profileImage').populate('application', 'applicationNumber')
        ]);

        // 5. Format and Process Data
        const userStatusStats = usersByStatus.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {});
        
        // Calculate application statuses from the single aggregation result (Huge performance boost!)
        const appStatusStats = applicationsByStatus.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {});
        const pendingApplications = appStatusStats['Pending'] || 0;
        const inProgressApplications = (appStatusStats['Started'] || 0) + (appStatusStats['ReviewbyOoshas'] || 0) + (appStatusStats['SubmitToSchool'] || 0) + (appStatusStats['AwaitingSchoolResponse'] || 0) + (appStatusStats['AdmissionProcessing'] || 0);
        const offerReceivedApplications = appStatusStats['OfferReceived'] || 0;
        const completedApplications = appStatusStats['Completed'] || 0;
        const refusedApplications = appStatusStats['Refused'] || 0;
        const visaProcessingApplications = appStatusStats['VisaProcessing'] || 0;
        const withdrawnApplications = appStatusStats['Withdrawn'] || 0;

        // Calculate ticket statuses from aggregation
        const ticketStatusStats = ticketsByStatus.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {});
        const openTickets = ticketStatusStats['open'] || 0;
        const pendingTickets = ticketStatusStats['pending'] || 0;
        const resolvedTickets = ticketStatusStats['resolved'] || 0;
        const closedTickets = ticketStatusStats['closed'] || 0;

        const priorityStats = { Low: 0, Medium: 0, High: 0, Urgent: 0 };
        ticketsByPriority.forEach(item => { if (priorityStats.hasOwnProperty(item._id)) priorityStats[item._id] = item.count; });

        const visaCountryStats = visaByCountry.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {});

        const totalRevenue = totalRevenueAgg[0]?.total || 0;
        const todayRevenue = todayRevenueAgg[0]?.total || 0;
        const weekRevenue = weekRevenueAgg[0]?.total || 0;
        const monthRevenue = monthRevenueAgg[0]?.total || 0;

        // 6. Construct Final "Amazing" Response
        const dashboardData = {
            success: true,
            message: 'Counsellor dashboard data fetched successfully',
            data: {
                overview: {
                    totalAssignedUsers,
                    activeUsers: activeUsersCount,
                    totalApplications: totalApplicationsCount,
                    totalRevenue,
                    openTickets,
                    unreadMessages: unreadCommunications
                },
                users: {
                    total: totalAssignedUsers,
                    active: activeUsersCount,
                    byStatus: userStatusStats,
                    newUsers: { today: newUsersToday, thisWeek: newUsersThisWeek, thisMonth: newUsersThisMonth },
                    activeLast7Days: activeUsersLast7Days
                },
                applications: {
                    total: totalApplicationsCount,
                    byStatus: {
                        pending: pendingApplications, inProgress: inProgressApplications, offerReceived: offerReceivedApplications,
                        visaProcessing: visaProcessingApplications, completed: completedApplications, refused: refusedApplications, withdrawn: withdrawnApplications
                    },
                    rawStatusCounts: appStatusStats, // Keeps all exact enum statuses just in case frontend needs them
                    topCountries: topApplicationCountries,
                    newApplications: { today: newApplicationsToday, thisWeek: newApplicationsThisWeek, thisMonth: newApplicationsThisMonth },
                    recent: recentApplications
                },
                support: {
                    total: totalTicketsCount,
                    byStatus: { open: openTickets, pending: pendingTickets, resolved: resolvedTickets, closed: closedTickets },
                    byPriority: priorityStats,
                    recent: recentTickets
                },
                visaProcessing: {
                    total: totalVisaProcesses,
                    byCountry: visaCountryStats
                },
                communications: {
                    total: totalCommunications,
                    unread: unreadCommunications,
                    recent: recentCommunications
                },
                revenue: {
                    total: totalRevenue, today: todayRevenue, thisWeek: weekRevenue, thisMonth: monthRevenue,
                    completedPurchases: totalCompletedPurchasesCount,
                    recentPurchases: recentPurchases
                },
                metrics: {
                    applicationConversionRate: totalAssignedUsers > 0 ? ((totalApplicationsCount / totalAssignedUsers) * 100).toFixed(2) : 0,
                    offerRate: totalApplicationsCount > 0 ? ((offerReceivedApplications / totalApplicationsCount) * 100).toFixed(2) : 0,
                    completionRate: totalApplicationsCount > 0 ? ((completedApplications / totalApplicationsCount) * 100).toFixed(2) : 0,
                    supportResolutionRate: totalTicketsCount > 0 ? ((resolvedTickets / totalTicketsCount) * 100).toFixed(2) : 0,
                    activeUserRate: totalAssignedUsers > 0 ? ((activeUsersCount / totalAssignedUsers) * 100).toFixed(2) : 0
                }
            }
        };

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error('Counsellor Dashboard Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching counsellor dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }
};


const getUserStats = async (req, res) => {
    try {
        const { role } = req.query;

        // Build query based on role filter
        let query = {};
        if (role && ['admin', 'manager', 'counsellor', 'user'].includes(role)) {
            query.role = role;
        }

        if (req.user.role === 'counsellor') {
            query.assignto = req.user._id;
        }

        const [
            totalUsers,
            activeUsers,
            inactiveUsers,
            suspendedUsers,
            usersByRole,
            usersByStatus,
            usersByMonth,
            recentUsers,
            genderStats,
            nationalityStats
        ] = await Promise.all([
            User.countDocuments(query),
            User.countDocuments({ ...query, status: 'Active' }),
            User.countDocuments({ ...query, status: 'Inactive' }),
            User.countDocuments({ ...query, status: 'Suspended' }),
            User.aggregate([
                { $match: query },
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]),
            User.aggregate([
                { $match: query },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            User.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 12 }
            ]),
            User.find(query)
                .sort({ createdAt: -1 })
                .limit(20)
                .select('name email role status createdAt lastLogin'),
            User.aggregate([
                { $match: query },
                { $group: { _id: '$gender', count: { $sum: 1 } } }
            ]),
            User.aggregate([
                { $match: query },
                { $group: { _id: '$nationality', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ])
        ]);

        // Format role data
        const roleStats = {
            admin: 0,
            manager: 0,
            counsellor: 0,
            user: 0
        };
        usersByRole.forEach(item => {
            if (roleStats.hasOwnProperty(item._id)) {
                roleStats[item._id] = item.count;
            }
        });

        // Format status data
        const statusStats = {};
        usersByStatus.forEach(item => {
            statusStats[item._id] = item.count;
        });

        // Format monthly data
        const monthlyData = usersByMonth.map(item => ({
            month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
            count: item.count
        }));

        // Format gender data
        const genderData = {};
        genderStats.forEach(item => {
            if (item._id) {
                genderData[item._id] = item.count;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                total: totalUsers,
                active: activeUsers,
                inactive: inactiveUsers,
                suspended: suspendedUsers,
                byRole: roleStats,
                byStatus: statusStats,
                monthlyGrowth: monthlyData,
                recentUsers,
                demographics: {
                    gender: genderData,
                    topNationalities: nationalityStats.filter(n => n._id)
                },
                filters: {
                    appliedRole: role || 'all'
                }
            }
        });
    } catch (error) {
        console.error('User Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
};

const getDashboardOverview = async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            return await getAdminDashboard(req, res);
        } else if (req.user.role === 'counsellor') {
            return await getCounsellorDashboard(req, res);
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Invalid role for dashboard access.'
            });
        }
    } catch (error) {
        console.error('Dashboard Overview Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard overview',
            error: error.message
        });
    }
};


router.use(protect);

router.get('/overview', getDashboardOverview);

router.get('/admin', authorize('admin'), getAdminDashboard);

router.get('/counsellor', authorize('counsellor', 'admin'), getCounsellorDashboard);

router.get('/user-stats', getUserStats);

module.exports = router;