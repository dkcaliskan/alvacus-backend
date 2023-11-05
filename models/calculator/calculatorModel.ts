import { model, Schema } from 'mongoose';

const savedUsersSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});
const selectedUnitsSchema = new Schema({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
});

const inputLabels = new Schema({
  inputOneLabel: {
    type: String,
  },
  inputTwoLabel: {
    type: String,
  },
  inputThreeLabel: {
    type: String,
  },
  inputFourLabel: {
    type: String,
  },
  inputFiveLabel: {
    type: String,
  },
  inputSixLabel: {
    type: String,
  },
  outputLabel: {
    type: String,
  },
});

const inputSelects = new Schema({
  isUnitSelect: {
    type: Boolean,
    default: false,
  },

  inputOneSelect: {
    type: Boolean,
    default: false,
  },

  inputOneBaseUnit: {
    label: { type: String },
    value: { type: String },
    category: { type: String },
  },
  inputOneSelectedUnits: [selectedUnitsSchema],

  inputTwoSelect: {
    type: Boolean,
    default: false,
  },

  inputTwoBaseUnit: {
    label: { type: String },
    value: { type: String },
    category: { type: String },
  },
  inputTwoSelectedUnits: [selectedUnitsSchema],

  inputThreeSelect: {
    type: Boolean,
    default: false,
  },

  inputThreeBaseUnit: {
    label: { type: String },
    value: { type: String },
    category: { type: String },
  },
  inputThreeSelectedUnits: [selectedUnitsSchema],

  inputFourSelect: {
    type: Boolean,
    default: false,
  },

  inputFourBaseUnit: {
    label: { type: String },
    value: { type: String },
    category: { type: String },
  },
  inputFourSelectedUnits: [selectedUnitsSchema],

  inputFiveSelect: {
    type: Boolean,
    default: false,
  },

  inputFiveBaseUnit: {
    label: { type: String },
    value: { type: String },
    category: { type: String },
  },
  inputFiveSelectedUnits: [selectedUnitsSchema],

  inputSixSelect: {
    type: Boolean,
    default: false,
  },

  inputSixBaseUnit: {
    label: { type: String },
    value: { type: String },
    category: { type: String },
  },
  inputSixSelectedUnits: [selectedUnitsSchema],

  outputSelect: {
    type: Boolean,
    default: false,
  },
  outputBaseUnit: {
    label: { type: String },
    value: { type: String },
    category: { type: String },
  },
  outputSelectedUnits: [selectedUnitsSchema],
});

const CalculatorSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: 'modular',
      required: true,
    },
    inputLabels,
    inputLength: {
      type: Number,
    },

    formula: {
      type: String,
    },
    formulaVariables: {
      type: Array,
    },

    isInfoMarkdown: {
      type: Boolean,
      default: false,
      required: true,
    },
    info: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      required: true,
    },

    inputSelects,
    savedUsers: [savedUsersSchema],
  },
  {
    timestamps: true,
  }
);

const Calculator = model('Calculator', CalculatorSchema);

export default Calculator;
