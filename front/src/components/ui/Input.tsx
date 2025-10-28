import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="input-group">
      {label && <label className="label">{label}</label>}
      <input className={`input ${className}`} {...props} />
      {error && <div className="error">{error}</div>}
    </div>
  );
}