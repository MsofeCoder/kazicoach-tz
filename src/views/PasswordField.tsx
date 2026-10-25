import { useEffect, useId, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const [visible, setVisible] = useState(false);

  useEffect(() => { if (!props.value) setVisible(false); }, [props.value]);

  return <div className="password-field" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setVisible(false);
  }}>
    <label htmlFor={id}>{label}</label>
    <span className="password-control">
      <input {...props} id={id} type={visible ? 'text' : 'password'} />
      <button type="button" className="password-toggle" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={visible} aria-controls={id} onClick={() => setVisible(current => !current)}>
        {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
      </button>
    </span>
  </div>;
}
