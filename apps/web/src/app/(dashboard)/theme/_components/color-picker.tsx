import { Input } from "@avo/ui/components/ui/input";
import { Label } from "@avo/ui/components/ui/label";

interface ColorPickerProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

const HASH_PREFIX_RE = /^#+/;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{0,6}$/;

export function ColorPicker({
  label,
  description,
  value,
  onChange,
}: ColorPickerProps) {
  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.trim();
    v = `#${v.replace(HASH_PREFIX_RE, "").slice(0, 6)}`;
    if (HEX_COLOR_RE.test(v)) {
      onChange(v);
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          className="h-10 w-10 cursor-pointer rounded-md border bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0"
          onChange={(e) => onChange(e.target.value)}
          type="color"
          value={value}
        />
        <Input
          className="w-28 font-mono text-sm uppercase"
          maxLength={7}
          onChange={handleTextChange}
          value={value}
        />
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
