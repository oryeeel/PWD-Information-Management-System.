const mongoose = require("mongoose");

const pwdRecordSchema = new mongoose.Schema(
  {
    pwdId: {
      type: String,
      required: true,
      unique: true,
    },

    firstName: {
      type: String,
      required: true,
    },

    middleName: {
      type: String,
      default: "",
    },

    lastName: {
      type: String,
      required: true,
    },

    birthdate: {
      type: String,
      default: "",
    },

    age: {
      type: Number,
      default: 0,
    },

    gender: {
      type: String,
      default: "",
    },

    barangay: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    disabilityType: {
      type: String,
      default: "",
    },

    disabilities: {
      type: [String],
      default: [],
    },

    contact: {
      type: String,
      default: "",
    },

    civilStatus: { type: String, default: "" },
    bloodType: { type: String, default: "" },
    emergencyContactName: { type: String, default: "" },
    emergencyContactPhone: { type: String, default: "" },
    photo: { type: String, default: "" },
    proofOfDisability: { type: String, default: "", select: false },
    pwdIdPhoto: { type: String, default: "", select: false },

    status: {
      type: String,
      default: "Active",
    },

    addedBy: {
      type: String,
      default: "Admin",
    },

    deletedAt: { type: Date, default: null, index: true },

    lastViewedAt: {
      type: Date,
      default: null,
    },

    lastEditedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PwdRecord", pwdRecordSchema);
