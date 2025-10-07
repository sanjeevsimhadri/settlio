import React, { useState, useEffect } from 'react';
import { Select, Input } from './Input';
import { countryCodes, parsePhoneNumber, formatPhoneNumber } from '../../utils/phoneUtils';

export interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  placeholder = "Enter phone number",
  required = false,
}) => {
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Parse initial value only once on mount
  useEffect(() => {
    if (value) {
      const parsed = parsePhoneNumber(value);
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.number);
    }
  }, []); // Only run on mount

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = e.target.value;
    setCountryCode(newCountryCode);
    // Immediately update parent
    const fullNumber = phoneNumber ? `${newCountryCode}${phoneNumber}` : '';
    onChange(fullNumber);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers, spaces, hyphens, parentheses
    const cleaned = e.target.value.replace(/[^\d\s\-()]/g, '');
    setPhoneNumber(cleaned);
    // Immediately update parent
    const fullNumber = cleaned ? `${countryCode}${cleaned}` : '';
    onChange(fullNumber);
  };

  return (
    <div className="phone-input">
      {label && (
        <label className="form-field__label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="flex gap-3">
        {/* Country Code Selector */}
        <div className="w-32 flex-shrink-0">
          <Select
            value={countryCode}
            onChange={handleCountryCodeChange}
            placeholder="Code"
          >
            {countryCodes.map((country) => (
              <option key={`${country.code}-${country.name}`} value={country.code}>
                {country.flag} {country.code}
              </option>
            ))}
          </Select>
        </div>
        
        {/* Phone Number Input */}
        <div className="flex-1">
          <Input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            placeholder={placeholder}
            error={error}
          />
        </div>
      </div>
      
      {(error || helperText) && (
        <div className="form-field__helper">
          {error ? (
            <span className="form-field__error" role="alert" aria-live="polite">
              {error}
            </span>
          ) : (
            <span className="form-field__helper-text">{helperText}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default PhoneInput;