"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UiPreferenceSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.UiPreferenceSchema = new mongoose_1.default.Schema({
    layout: String,
}, { _id: false });
