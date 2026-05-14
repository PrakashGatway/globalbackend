const mongoose = require('mongoose');

const CountryExtradetails = new mongoose.Schema(
  {
    sections: [
      {
        section_key: { type: String, required: true },
        heading: { type: String, default: '', trim: true },
        content: { type: String, default: '', trim: true },
        order: { type: Number, default: 0 }
      }
    ],
    faq: [
      {
        question: { type: String, trim: true },
        answer: { type: String, trim: true }
      }
    ],
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    visa_details: {
      type: {
        source_country_iso: { type: String, required: true, match: /^[A-Z]{3}$/, uppercase: true, trim: true },
        destination_country_iso: { type: String, required: true, match: /^[A-Z]{3}$/, uppercase: true, trim: true },
        visa_type: { type: String, required: true, trim: true },
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        last_updated: { type: Date, required: true },
        
        entry_classification: {
          type: { type: String, required: true, enum: ['Visa Required', 'eVisa', 'Visa on Arrival', 'Visa Free'] },
          is_interview_mandatory: { type: Boolean, required: true },
          visa_category: { type: String, trim: true }
        },
        
        validity_rules: {
          passport_validity_months_required: { type: Number, required: true, min: 0 },
          blank_pages_required: { type: Number, required: true, min: 0 },
          visa_validity_days: { type: Number, default: null },
          max_stay_duration_days: { type: Number, default: null },
          multiple_entry_allowed: { type: Boolean, default: false }
        },
        
        fees: [{
          type: { type: String, required: true },
          amount: { type: Number, required: true, min: 0 },
          currency: { type: String, required: true, match: /^[A-Z]{3}$/, uppercase: true, trim: true },
          is_refundable: { type: Boolean, default: false },
          notes: { type: String, trim: true }
        }],
        
        required_documents: {
          mandatory: { type: [String], required: true },
          supporting: { type: [String], required: true },
          financial_proof: {
            bank_statement_months: { type: Number, min: 0 },
            tax_returns_years: { type: Number, min: 0 },
            min_liquid_balance: { type: Number, default: null },
            blocked_account_required: { type: Boolean, default: false },
            sponsor_allowed: { type: Boolean, default: false }
          },
          photo_specifications: {
            dimensions: { type: String, trim: true },
            background_color: { type: String, trim: true },
            digital_required: { type: Boolean, default: false },
            physical_copies_required: { type: Number, min: 0 },
            biometric_required: { type: Boolean, default: false }
          }
        },
        
        process_steps: [{
          step_number: { type: Number, required: true, min: 1 },
          title: { type: String, required: true, trim: true },
          action: { type: String, required: true, trim: true },
          location: { type: String, required: true, trim: true },
          description: { type: String, trim: true },
          documents_required: [String],
          tips: [String],
          possible_questions: [String],
          estimated_duration_days: { type: Number, default: null, min: 0 }
        }],
        
        // biometrics_required: { type: Boolean, default: false },
        // medical_insurance_required: { type: Boolean, default: false },
        // aps_certificate_required: { type: Boolean, default: false },
        // average_processing_time_days: { type: Number, min: 0, default: 0 },
        
         other: { 
          type: mongoose.Schema.Types.Mixed, // Allows Object, Array, String, Number, etc.
          default: {} 
        },
        status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' }
      },
      required: true // Ensures the visa_details object itself is provided
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CountryExtradetails', CountryExtradetails);