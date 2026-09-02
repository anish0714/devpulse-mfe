import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
} from "pdf-lib";

export type FieldValue = string | boolean | string[];

interface TextFieldDescriptor {
  kind: "text";
  name: string;
  multiline: boolean;
  maxLength: number | undefined;
  initial: string;
}
interface CheckBoxDescriptor {
  kind: "checkbox";
  name: string;
  initial: boolean;
}
interface RadioGroupDescriptor {
  kind: "radio";
  name: string;
  options: string[];
  initial: string | undefined;
}
interface DropdownDescriptor {
  kind: "dropdown";
  name: string;
  options: string[];
  initial: string | undefined;
}
interface OptionListDescriptor {
  kind: "optionlist";
  name: string;
  options: string[];
  initial: string[];
}
interface UnsupportedDescriptor {
  kind: "unsupported";
  name: string;
}

export type FieldDescriptor =
  | TextFieldDescriptor
  | CheckBoxDescriptor
  | RadioGroupDescriptor
  | DropdownDescriptor
  | OptionListDescriptor
  | UnsupportedDescriptor;

export function describeFields(doc: PDFDocument): FieldDescriptor[] {
  const form = doc.getForm();
  return form.getFields().map((field): FieldDescriptor => {
    const name = field.getName();

    if (field instanceof PDFTextField) {
      return {
        kind: "text",
        name,
        multiline: field.isMultiline(),
        maxLength: field.getMaxLength(),
        initial: field.getText() ?? "",
      };
    }
    if (field instanceof PDFCheckBox) {
      return { kind: "checkbox", name, initial: field.isChecked() };
    }
    if (field instanceof PDFRadioGroup) {
      return {
        kind: "radio",
        name,
        options: field.getOptions(),
        initial: field.getSelected(),
      };
    }
    if (field instanceof PDFDropdown) {
      return {
        kind: "dropdown",
        name,
        options: field.getOptions(),
        initial: field.getSelected()[0],
      };
    }
    if (field instanceof PDFOptionList) {
      return {
        kind: "optionlist",
        name,
        options: field.getOptions(),
        initial: field.getSelected(),
      };
    }
    return { kind: "unsupported", name };
  });
}

export function initialValues(fields: FieldDescriptor[]): Record<string, FieldValue> {
  const values: Record<string, FieldValue> = {};
  for (const field of fields) {
    if (field.kind === "text") values[field.name] = field.initial;
    else if (field.kind === "checkbox") values[field.name] = field.initial;
    else if (field.kind === "radio" || field.kind === "dropdown") values[field.name] = field.initial ?? "";
    else if (field.kind === "optionlist") values[field.name] = field.initial;
  }
  return values;
}

export function applyFieldValues(doc: PDFDocument, values: Record<string, FieldValue>): void {
  const form = doc.getForm();
  for (const field of form.getFields()) {
    const name = field.getName();
    if (!(name in values)) continue;
    const value = values[name];

    if (field instanceof PDFTextField && typeof value === "string") {
      field.setText(value);
    } else if (field instanceof PDFCheckBox && typeof value === "boolean") {
      if (value) field.check();
      else field.uncheck();
    } else if (field instanceof PDFRadioGroup && typeof value === "string") {
      if (value) field.select(value);
    } else if (field instanceof PDFDropdown && typeof value === "string") {
      if (value) field.select(value);
    } else if (field instanceof PDFOptionList && Array.isArray(value)) {
      field.select(value);
    }
  }
}
