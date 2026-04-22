const mongoose = require('mongoose');

const communicationSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  type: { type: String, enum: ['activity', 'message'], required: true },
  
  action: { type: String }, // 'status_change', 'doc_upload', 'backup_added', 'intake_changed'
  description: { type: String },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  
  content: { type: String },
  isRead: { type: Boolean, default: false },
  
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userType: { type: String, enum: ['student', 'ooshas', 'admin'] },
}, { timestamps: true });

// Index for efficient queries
communicationSchema.index({ application: 1, createdAt: -1 });
communicationSchema.index({ type: 1, application: 1 });

module.exports = mongoose.model('Communication', communicationSchema);