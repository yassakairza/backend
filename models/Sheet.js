const mongoose = require('mongoose');

const SheetSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    editToken: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    ownerId: { type: String, default: null, index: true },
  },
  { timestamps: true }
);

// mongoose.models.Sheet reuses an already-registered model instead of
// redefining it, which avoids an "OverwriteModelError" when the serverless
// function is reused across invocations.
module.exports = mongoose.models.Sheet || mongoose.model('Sheet', SheetSchema);
