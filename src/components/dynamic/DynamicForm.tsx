import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { clsx } from 'clsx';
import type { ModuleField, DynamicRecord } from '../../types';
import { Input, Textarea, Select } from '../ui/Input';
import Button from '../ui/Button';

interface DynamicFormProps {
  fields: ModuleField[];
  defaultValues?: DynamicRecord;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  layout?: 'single-column' | 'two-column';
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  defaultValues,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  layout = 'single-column',
}) => {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: defaultValues || {},
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  const formFields = fields.filter((f) => f.showInForm && !f.isHidden && !f.isReadOnly);

  const renderField = (field: ModuleField) => {
    const error = errors[field.columnName]?.message as string | undefined;
    const rules: Record<string, unknown> = {};

    if (field.isRequired) {
      rules.required = `${field.label || field.name} is required`;
    }
    if (field.validation?.min !== undefined) {
      rules.min = { value: field.validation.min as number, message: `Minimum value is ${field.validation.min}` };
    }
    if (field.validation?.max !== undefined) {
      rules.max = { value: field.validation.max as number, message: `Maximum value is ${field.validation.max}` };
    }
    if (field.validation?.minLength !== undefined) {
      rules.minLength = { value: field.validation.minLength as number, message: `Minimum length is ${field.validation.minLength}` };
    }
    if (field.validation?.maxLength !== undefined) {
      rules.maxLength = { value: field.validation.maxLength as number, message: `Maximum length is ${field.validation.maxLength}` };
    }
    if (field.validation?.pattern) {
      rules.pattern = { value: new RegExp(field.validation.pattern as string), message: (field.validation.patternMessage as string) || 'Invalid format' };
    }

    const commonProps = {
      label: field.label || field.name,
      error,
      required: field.isRequired,
    };

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <Input
            {...commonProps}
            type={field.fieldType === 'email' ? 'email' : field.fieldType === 'url' ? 'url' : 'text'}
            placeholder={field.placeholder || `Enter ${field.label || field.name}`}
            {...register(field.columnName, rules)}
          />
        );

      case 'number':
      case 'decimal':
      case 'currency':
        return (
          <Input
            {...commonProps}
            type="number"
            step={field.fieldType === 'decimal' || field.fieldType === 'currency' ? '0.01' : '1'}
            placeholder={field.placeholder}
            {...register(field.columnName, { ...rules, valueAsNumber: true })}
          />
        );

      case 'password':
        return (
          <Input
            {...commonProps}
            type="password"
            placeholder={field.placeholder || 'Enter password'}
            {...register(field.columnName, rules)}
          />
        );

      case 'textarea':
      case 'richtext':
        return (
          <Textarea
            {...commonProps}
            placeholder={field.placeholder || `Enter ${field.label || field.name}`}
            rows={4}
            {...register(field.columnName, rules)}
          />
        );

      case 'select':
      case 'radio':
        return (
          <Select
            {...commonProps}
            options={(field.options || []).map((o) => ({ label: o.label, value: o.value }))}
            placeholder={`Select ${field.label || field.name}`}
            {...register(field.columnName, rules)}
          />
        );

      case 'boolean':
      case 'checkbox':
        return (
          <div className="flex items-start gap-3">
            <Controller
              name={field.columnName}
              control={control}
              rules={rules}
              render={({ field: f }) => (
                <input
                  type="checkbox"
                  id={field.columnName}
                  checked={!!f.value}
                  onChange={(e) => f.onChange(e.target.checked)}
                  className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500 mt-1"
                />
              )}
            />
            <label htmlFor={field.columnName} className="text-sm font-medium text-surface-700 dark:text-surface-300 cursor-pointer">
              {field.label || field.name}
              {field.helpText && <span className="block text-xs text-surface-400 font-normal mt-0.5">{field.helpText}</span>}
            </label>
          </div>
        );

      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
            {...register(field.columnName, rules)}
          />
        );

      case 'datetime':
        return (
          <Input
            {...commonProps}
            type="datetime-local"
            {...register(field.columnName, rules)}
          />
        );

      case 'time':
        return (
          <Input
            {...commonProps}
            type="time"
            {...register(field.columnName, rules)}
          />
        );

      case 'color':
        return (
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              {field.label || field.name}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-10 h-10 rounded-xl border border-surface-200 cursor-pointer"
                {...register(field.columnName, rules)}
              />
              <Input
                placeholder="#000000"
                {...register(field.columnName, rules)}
              />
            </div>
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'rating':
        return (
          <Controller
            name={field.columnName}
            control={control}
            rules={rules}
            render={({ field: f }) => (
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  {field.label || field.name}
                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => f.onChange(star)}
                      className={clsx(
                        'text-2xl transition-colors',
                        (f.value || 0) >= star ? 'text-amber-400' : 'text-surface-300'
                      )}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
              </div>
            )}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            placeholder={field.placeholder || `Enter ${field.label || field.name}`}
            {...register(field.columnName, rules)}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={clsx(
        'grid gap-5',
        layout === 'two-column' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
      )}>
        {formFields.map((field) => (
          <div
            key={field.id}
            className={clsx(
              field.colSpan > 1 && layout === 'two-column' && 'sm:col-span-2'
            )}
          >
            {renderField(field)}
            {field.helpText && field.fieldType !== 'boolean' && field.fieldType !== 'checkbox' && (
              <p className="mt-1 text-xs text-surface-400">{field.helpText}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-surface-100 dark:border-surface-800">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default DynamicForm;
