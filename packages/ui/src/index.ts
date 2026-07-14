export interface ButtonProps {
  label: string;
}

export function Button(props: ButtonProps): string {
  return `<button>${props.label}</button>`;
}
