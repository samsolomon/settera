import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useSetteraSetting, useSetteraAction } from "@settera/react";
import type { SetteraCustomPageProps } from "@/components/settera/settera-page";
import type { SetteraCustomSettingProps } from "@/components/settera/settera-setting";
import type { SetteraActionPageProps } from "@/components/settera/settera-subpage-content";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const demoUsers = [
  {
    initials: "AU",
    name: "Admin User",
    email: "admin@feedback-notes.com",
    role: "Admin",
    created: "Feb 13, 2026",
  },
  {
    initials: "JT",
    name: "Jake Torres",
    email: "jake@feedback-notes.com",
    role: "Member",
    created: "Feb 13, 2026",
  },
  {
    initials: "MC",
    name: "Maria Chen",
    email: "maria@feedback-notes.com",
    role: "Member",
    created: "Feb 13, 2026",
  },
  {
    initials: "RU",
    name: "Review User",
    email: "reviewer@feedback-notes.com",
    role: "Member",
    created: "Feb 13, 2026",
  },
  {
    initials: "SS",
    name: "Sam Solomon",
    email: "sam@feedback-notes.com",
    role: "Admin",
    created: "Feb 13, 2026",
  },
];

export function UsersPage({ page }: SetteraCustomPageProps) {
  return (
    <section className="mt-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <Input
            aria-label="Search users"
            placeholder="Search users..."
            className="min-w-[220px]"
          />
          <Select defaultValue="all">
            <SelectTrigger aria-label="Filter role" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline">+ Add user</Button>
      </div>

      <div
        aria-label={`${page.title} table`}
        className="border rounded-xl bg-card overflow-hidden"
      >
        {demoUsers.map((user, index) => (
          <div
            key={user.email}
            className={`grid grid-cols-[64px_1fr_140px_140px_40px] items-center gap-2 px-4 py-3 ${
              index > 0 ? "border-t" : ""
            }`}
          >
            <span className="text-muted-foreground text-sm">
              {user.initials}
            </span>
            <div>
              <div className="text-[15px] font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
            <span className="text-sm">{user.role}</span>
            <span className="text-sm text-muted-foreground">
              {user.created}
            </span>
            <span className="text-right text-muted-foreground">...</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProfilePictureSetting({
  settingKey,
}: SetteraCustomSettingProps) {
  const { value, setValue } = useSetteraSetting(settingKey);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUrl = typeof value === "string" ? value : "";
  const initials = imageUrl ? "" : "B";

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setValue(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="size-16 rounded-full flex items-center justify-center text-2xl font-semibold text-white shrink-0 bg-primary"
        style={
          imageUrl
            ? { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        {initials}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          if (imageUrl) {
            setValue("");
          } else {
            fileInputRef.current?.click();
          }
        }}
      >
        {imageUrl ? "Remove image" : "Upload image"}
      </Button>
    </div>
  );
}

export function AdvancedExportPage({
  settingKey,
  definition,
  onBack,
}: SetteraActionPageProps) {
  const { onAction, isLoading } = useSetteraAction(settingKey);
  const [format, setFormat] = useState("json");
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sawLoadingRef = useRef(false);

  useEffect(() => {
    if (isLoading) sawLoadingRef.current = true;
    if (!isSubmitting) return;
    if (sawLoadingRef.current && isLoading) return;
    setIsSubmitting(false);
    sawLoadingRef.current = false;
    onBack();
  }, [isLoading, isSubmitting, onBack]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        This is a custom-rendered action page for &ldquo;{definition.title}
        &rdquo;. It demonstrates the <code>page.renderer</code> pattern.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label>Export Format</Label>
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="xml">XML</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="include-attachments"
          checked={includeAttachments}
          onCheckedChange={(checked) =>
            setIncludeAttachments(checked === true)
          }
        />
        <Label htmlFor="include-attachments">Include attachments</Label>
      </div>

      <div className="flex gap-2 mt-2">
        <Button
          disabled={isLoading}
          onClick={() => {
            onAction?.({ format, includeAttachments });
            setIsSubmitting(true);
          }}
        >
          {isLoading ? "Exporting..." : "Start Export"}
        </Button>
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
