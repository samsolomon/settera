import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useSetteraSetting, useSetteraAction } from "@settera/react";
import type { CustomSetting } from "@settera/schema";
import type { SetteraCustomPageProps } from "@/components/settera/settera-page";
import type { SetteraCustomSettingProps } from "@/components/settera/settera-setting";
import type { SetteraActionPageProps } from "@/components/settera/settera-subpage-content";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/components/users-table/users-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from "@/components/ui/input-group";

export function UsersPage(_props: SetteraCustomPageProps) {
  return (
    <section className="mt-4">
      <UsersTable />
    </section>
  );
}

const connectedAccounts = [
  {
    name: "Slack",
    description: "Post updates and receive notifications in your Slack workspace.",
    buttonLabel: "Connect",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.527 2.527 0 0 1 2.521 2.521 2.527 2.527 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.527 2.527 0 0 1-2.522 2.521 2.527 2.527 0 0 1-2.521-2.521V2.522A2.527 2.527 0 0 1 15.164 0a2.528 2.528 0 0 1 2.522 2.522v6.312z" fill="#2EB67D"/>
        <path d="M15.164 18.956a2.528 2.528 0 0 1 2.522 2.522A2.528 2.528 0 0 1 15.164 24a2.527 2.527 0 0 1-2.521-2.522v-2.522h2.521zm0-1.27a2.527 2.527 0 0 1-2.521-2.522 2.527 2.527 0 0 1 2.521-2.521h6.314A2.528 2.528 0 0 1 24 15.164a2.528 2.528 0 0 1-2.522 2.522h-6.314z" fill="#ECB22E"/>
      </svg>
    ),
  },
  {
    name: "GitHub",
    description: "Link commits and pull requests to your activity timeline.",
    buttonLabel: "Connect",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
  },
];

export function ConnectedAccountsPage({ page }: SetteraCustomPageProps) {
  return (
    <section className="mt-4 flex flex-col gap-3">
      {connectedAccounts.map((account) => (
        <div
          key={account.name}
          className="flex items-center gap-4 border rounded-xl bg-card px-5 py-4"
        >
          <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
            {account.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-medium">{account.name}</div>
            <div className="text-sm text-muted-foreground">
              {account.description}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => console.info(`[shadcn-test-app] Connect ${account.name} clicked`)}
          >
            {account.buttonLabel}
          </Button>
        </div>
      ))}
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

export function WorkspaceLogoSetting({
  settingKey,
}: SetteraCustomSettingProps) {
  const { value, setValue } = useSetteraSetting(settingKey);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUrl = typeof value === "string" ? value : "";
  const initials = imageUrl ? "" : "W";

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
        className="size-16 rounded-lg flex items-center justify-center text-2xl font-semibold text-white shrink-0 bg-primary"
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

export function WorkspaceUrlSetting({
  settingKey,
}: SetteraCustomSettingProps) {
  const { value, setValue } = useSetteraSetting(settingKey);
  const currentSlug = typeof value === "string" ? value : "";
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDraft(currentSlug);
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    setValue(draft);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground truncate">
        {currentSlug
          ? `https://appname.com/${currentSlug}`
          : "Not set"}
      </span>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Workspace URL</DialogTitle>
            <DialogDescription>
              Choose a URL slug for your workspace.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="py-2">
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>https://appname.com/</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="my-workspace"
                />
              </InputGroup>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ThemePickerSetting({
  settingKey,
}: SetteraCustomSettingProps) {
  const { value, setValue, definition } = useSetteraSetting(settingKey);
  const options = (definition as CustomSetting).config?.options as
    | Array<{ value: string; label: string; color: string }>
    | undefined;

  if (!options) return null;

  const selected = typeof value === "string" ? value : "";

  return (
    <div className="flex gap-3 flex-wrap">
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setValue(option.value)}
            className="flex flex-col items-center gap-1.5 bg-transparent border-none p-1 cursor-pointer"
          >
            <div
              className="size-6 rounded-full transition-shadow duration-150"
              style={{
                background: option.color,
                boxShadow: isSelected
                  ? `0 0 0 2px var(--background, #ffffff), 0 0 0 4px ${option.color}`
                  : "none",
              }}
            />
            <span
              className={`text-xs ${isSelected ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {option.label}
            </span>
          </button>
        );
      })}
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
