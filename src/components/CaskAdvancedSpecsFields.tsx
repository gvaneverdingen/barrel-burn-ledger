import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SPIRIT_TYPE_OPTIONS,
  WOOD_SPECIES_OPTIONS,
  FILL_GENERATION_OPTIONS,
  PREVIOUS_CONTENTS_OPTIONS,
  TOAST_LEVEL_OPTIONS,
  DUTY_STATUS_OPTIONS,
} from "@/lib/caskSpecs";
import { cidError } from "@/lib/ipfs";

export type AdvancedSpecsState = {
  dsp_code: string;
  spirit_type: string;
  wood_species: string;
  char_level: string;
  toast_level: string;
  cooperage: string;
  cask_fill_generation: string;
  previous_contents: string;
  original_lpa: string;
  duty_status: string;
  insurance_valuation: string;
  provenance_doc_hash: string;
};

export const emptyAdvancedSpecs: AdvancedSpecsState = {
  dsp_code: "",
  spirit_type: "",
  wood_species: "",
  char_level: "",
  toast_level: "",
  cooperage: "",
  cask_fill_generation: "",
  previous_contents: "",
  original_lpa: "",
  duty_status: "under_bond",
  insurance_valuation: "",
  provenance_doc_hash: "",
};

/** Validates fields that have format constraints. Returns an error message or null. */
export function validateAdvancedSpecs(s: AdvancedSpecsState): string | null {
  if (!s.dsp_code.trim()) return "DSP / Warehouse Code is required (anchored on-chain).";
  if (!s.spirit_type) return "Spirit Type is required (anchored on-chain).";
  if (!s.wood_species) return "Wood Species is required (anchored on-chain).";
  if (!s.cask_fill_generation) return "Cask Fill Generation is required (anchored on-chain).";
  if (!s.previous_contents) return "Previous Contents is required (anchored on-chain).";
  if (!s.duty_status) return "Duty Status is required (anchored on-chain).";
  const char = parseInt(s.char_level, 10);
  if (!s.char_level || Number.isNaN(char) || char < 1 || char > 4) {
    return "Char Level (1–4) is required (anchored on-chain).";
  }
  const err = cidError(s.provenance_doc_hash);
  if (err) return `Provenance Document Hash: ${err}`;
  return null;
}

/** Maps the form state into Supabase insert/update payload values. */
export function buildAdvancedSpecsPayload(s: AdvancedSpecsState) {
  const num = (v: string) => (v === "" ? null : parseFloat(v));
  const int = (v: string) => (v === "" ? null : parseInt(v, 10));
  const txt = (v: string) => (v === "" ? null : v);
  return {
    dsp_code: txt(s.dsp_code),
    spirit_type: txt(s.spirit_type) as any,
    wood_species: txt(s.wood_species) as any,
    char_level: int(s.char_level),
    toast_level: txt(s.toast_level) as any,
    cooperage: txt(s.cooperage),
    cask_fill_generation: txt(s.cask_fill_generation) as any,
    previous_contents: txt(s.previous_contents) as any,
    original_lpa: num(s.original_lpa),
    duty_status: txt(s.duty_status) as any,
    insurance_valuation: num(s.insurance_valuation),
    insurance_valuation_at: s.insurance_valuation ? new Date().toISOString() : null,
    provenance_doc_hash: txt(s.provenance_doc_hash),
  };
}

interface Props {
  value: AdvancedSpecsState;
  onChange: (next: AdvancedSpecsState) => void;
}

const CaskAdvancedSpecsFields = ({ value, onChange }: Props) => {
  const update = <K extends keyof AdvancedSpecsState>(k: K, v: AdvancedSpecsState[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Provenance &amp; Cooperage</h3>
        <p className="text-xs text-muted-foreground">
          Required — these specs are anchored on-chain in the cask NFT and drive rarity scoring.
          Fields marked with * must be filled before the cask can be minted.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Spirit Type *</Label>
          <Select value={value.spirit_type} onValueChange={(v) => update("spirit_type", v)}>
            <SelectTrigger><SelectValue placeholder="Select spirit type" /></SelectTrigger>
            <SelectContent>
              {SPIRIT_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Wood Species *</Label>
          <Select value={value.wood_species} onValueChange={(v) => update("wood_species", v)}>
            <SelectTrigger><SelectValue placeholder="Select wood species" /></SelectTrigger>
            <SelectContent>
              {WOOD_SPECIES_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Cask Fill Generation *</Label>
          <Select value={value.cask_fill_generation} onValueChange={(v) => update("cask_fill_generation", v)}>
            <SelectTrigger><SelectValue placeholder="First-fill, refill..." /></SelectTrigger>
            <SelectContent>
              {FILL_GENERATION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Previous Contents *</Label>
          <Select value={value.previous_contents} onValueChange={(v) => update("previous_contents", v)}>
            <SelectTrigger><SelectValue placeholder="e.g. Ex-Sherry Oloroso" /></SelectTrigger>
            <SelectContent>
              {PREVIOUS_CONTENTS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Char Level (1–4) *</Label>
          <Input
            type="number"
            min={1}
            max={4}
            value={value.char_level}
            onChange={(e) => update("char_level", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Toast Level</Label>
          <Select value={value.toast_level} onValueChange={(v) => update("toast_level", v)}>
            <SelectTrigger><SelectValue placeholder="Light, medium, heavy" /></SelectTrigger>
            <SelectContent>
              {TOAST_LEVEL_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Cooperage</Label>
          <Input
            value={value.cooperage}
            onChange={(e) => update("cooperage", e.target.value)}
            placeholder="e.g. Speyside Cooperage"
          />
        </div>
        <div className="space-y-2">
          <Label>DSP / Warehouse Code *</Label>
          <Input
            value={value.dsp_code}
            onChange={(e) => update("dsp_code", e.target.value)}
            placeholder="e.g. DSP-KY-12345"
          />
        </div>
        <div className="space-y-2">
          <Label>Original LPA (at fill)</Label>
          <Input
            type="number"
            step="0.01"
            value={value.original_lpa}
            onChange={(e) => update("original_lpa", e.target.value)}
            placeholder="OLA in pure alcohol litres"
          />
        </div>
        <div className="space-y-2">
          <Label>Duty Status *</Label>
          <Select value={value.duty_status} onValueChange={(v) => update("duty_status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DUTY_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Insurance Valuation</Label>
          <Input
            type="number"
            step="0.01"
            value={value.insurance_valuation}
            onChange={(e) => update("insurance_valuation", e.target.value)}
            placeholder="Replacement value"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Provenance Document Hash (IPFS CID)</Label>
          <Input
            value={value.provenance_doc_hash}
            onChange={(e) => update("provenance_doc_hash", e.target.value)}
            placeholder="bafy... — points to WOWGR / cooperage docs"
            aria-invalid={!!cidError(value.provenance_doc_hash)}
          />
          {cidError(value.provenance_doc_hash) && (
            <p className="text-xs text-destructive">{cidError(value.provenance_doc_hash)}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Upload supporting docs (WOWGR, cooperage cert, delivery order) via the cask images section after creation.
            Paste the IPFS CID returned after uploading — formats accepted: Qm… (v0) or bafy… (v1).
          </p>
        </div>
      </div>
    </div>
  );
};

export default CaskAdvancedSpecsFields;