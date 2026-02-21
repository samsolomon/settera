import React, { useSyncExternalStore } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "../settera.js";
import { SetteraSchemaContext, SetteraValuesContext } from "../context.js";
import { useSetteraSetting } from "../hooks/useSetteraSetting.js";
import type { SetteraSchema } from "@settera/schema";

const schema: SetteraSchema = {
  version: "1.0",
  pages: [
    {
      key: "general",
      title: "General",
      sections: [
        {
          key: "main",
          title: "Main",
          settings: [
            {
              key: "toggle",
              title: "Toggle",
              type: "boolean",
              default: true,
            },
            {
              key: "name",
              title: "Name",
              type: "text",
              validation: { required: true },
            },
            {
              key: "dependent",
              title: "Dependent",
              type: "text",
              visibleWhen: { setting: "toggle", equals: true },
            },
          ],
        },
      ],
    },
    {
      key: "advanced",
      title: "Advanced",
      sections: [
        {
          key: "extra",
          title: "Extra",
          settings: [
            { key: "debug", title: "Debug", type: "boolean" },
          ],
        },
      ],
    },
  ],
};

// ---- Test helpers ----

function SettingDisplay({ settingKey }: { settingKey: string }) {
  const { value, setValue, error, isVisible } = useSetteraSetting(settingKey);
  return (
    <div data-testid={`setting-${settingKey}`}>
      <span data-testid={`value-${settingKey}`}>{String(value)}</span>
      <span data-testid={`visible-${settingKey}`}>
        {isVisible ? "visible" : "hidden"}
      </span>
      <span data-testid={`error-${settingKey}`}>{error ?? ""}</span>
      <button
        onClick={() => setValue(!value)}
        data-testid={`toggle-${settingKey}`}
      >
        toggle
      </button>
      <button
        onClick={() => setValue("")}
        data-testid={`clear-${settingKey}`}
      >
        clear
      </button>
    </div>
  );
}

function SchemaConsumer() {
  const ctx = React.useContext(SetteraSchemaContext);
  if (!ctx) return <div>no schema</div>;
  return (
    <div>
      <span data-testid="version">{ctx.schema.version}</span>
      <span data-testid="flat-count">{ctx.flatSettings.length}</span>
      <span data-testid="found-setting">
        {ctx.getSettingByKey("toggle")?.title ?? "not found"}
      </span>
      <span data-testid="found-page">
        {ctx.getPageByKey("appearance")?.title ?? "not found"}
      </span>
    </div>
  );
}

// ---- Schema context tests (from provider.test.tsx) ----

const minimalSchema: SetteraSchema = {
  version: "1.0",
  pages: [
    {
      key: "general",
      title: "General",
      sections: [
        {
          key: "main",
          title: "Main",
          settings: [
            { key: "toggle", title: "Toggle", type: "boolean", default: false },
          ],
        },
      ],
    },
    {
      key: "appearance",
      title: "Appearance",
    },
  ],
};

describe("Settera — schema context", () => {
  it("provides schema context", () => {
    render(
      <Settera schema={minimalSchema} values={{}} onChange={() => {}}>
        <SchemaConsumer />
      </Settera>,
    );
    expect(screen.getByTestId("version").textContent).toBe("1.0");
    expect(screen.getByTestId("flat-count").textContent).toBe("1");
    expect(screen.getByTestId("found-setting").textContent).toBe("Toggle");
    expect(screen.getByTestId("found-page").textContent).toBe("Appearance");
  });

  it("throws on invalid schema in non-production environments", () => {
    const badSchema = {
      version: "2.0" as "1.0",
      pages: [{ key: "p", title: "P" }],
    };
    expect(() => {
      render(
        <Settera schema={badSchema} values={{}} onChange={() => {}}>
          <div>child</div>
        </Settera>,
      );
    }).toThrow("[settera] Invalid schema");
  });

  it("does not warn on valid schema", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Settera schema={minimalSchema} values={{}} onChange={() => {}}>
        <div>child</div>
      </Settera>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

// ---- Values context tests (from renderer.test.tsx) ----

function ValuesConsumer() {
  const store = React.useContext(SetteraValuesContext);
  if (!store) return <div>no values context</div>;
  return <ValuesConsumerInner store={store} />;
}

function ValuesConsumerInner({
  store,
}: {
  store: NonNullable<React.ContextType<typeof SetteraValuesContext>>;
}) {
  const values = useSyncExternalStore(
    store.subscribe,
    () => store.getState().values,
  );
  return (
    <div>
      <span data-testid="toggle-value">{String(values.toggle)}</span>
      <button onClick={() => store.setValue("toggle", true)}>set-true</button>
    </div>
  );
}

describe("Settera — values context", () => {
  it("provides values context to children", () => {
    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={() => {}}>
        <ValuesConsumer />
      </Settera>,
    );
    expect(screen.getByTestId("toggle-value").textContent).toBe("false");
  });

  it("calls onChange when setValue is invoked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={onChange}>
        <ValuesConsumer />
      </Settera>,
    );
    await user.click(screen.getByText("set-true"));
    expect(onChange).toHaveBeenCalledWith("toggle", true);
  });

  it("renders children", () => {
    render(
      <Settera schema={schema} values={{}} onChange={() => {}}>
        <span data-testid="child">content</span>
      </Settera>,
    );
    expect(screen.getByTestId("child").textContent).toBe("content");
  });

  it("provides onAction and onValidate to context", () => {
    const onAction = vi.fn();
    const onValidate = vi.fn(() => null);

    function ActionConsumer() {
      const store = React.useContext(SetteraValuesContext);
      return (
        <div>
          <span data-testid="has-action">
            {store?.getOnAction() ? "yes" : "no"}
          </span>
          <span data-testid="has-validate">
            {store?.getOnValidate() ? "yes" : "no"}
          </span>
        </div>
      );
    }

    render(
      <Settera
        schema={schema}
        values={{}}
        onChange={() => {}}
        onAction={onAction}
        onValidate={onValidate}
      >
        <ActionConsumer />
      </Settera>,
    );
    expect(screen.getByTestId("has-action").textContent).toBe("yes");
    expect(screen.getByTestId("has-validate").textContent).toBe("yes");
  });
});

// ---- Unified Settera tests ----

describe("Settera (unified)", () => {
  it("provides schema and values in a single wrapper", () => {
    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={() => {}}>
        <SettingDisplay settingKey="toggle" />
      </Settera>,
    );
    expect(screen.getByTestId("value-toggle").textContent).toBe("false");
  });

  it("falls back to defaults from schema", () => {
    render(
      <Settera schema={schema} values={{}} onChange={() => {}}>
        <SettingDisplay settingKey="toggle" />
      </Settera>,
    );
    expect(screen.getByTestId("value-toggle").textContent).toBe("true");
  });

  it("calls onChange when setValue is invoked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Settera schema={schema} values={{ toggle: true }} onChange={onChange}>
        <SettingDisplay settingKey="toggle" />
      </Settera>,
    );
    await user.click(screen.getByTestId("toggle-toggle"));
    expect(onChange).toHaveBeenCalledWith("toggle", false);
  });

  it("evaluates visibility from values", () => {
    render(
      <Settera schema={schema} values={{ toggle: true }} onChange={() => {}}>
        <SettingDisplay settingKey="dependent" />
      </Settera>,
    );
    expect(screen.getByTestId("visible-dependent").textContent).toBe("visible");
  });

  it("evaluates visibility — hidden", () => {
    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={() => {}}>
        <SettingDisplay settingKey="dependent" />
      </Settera>,
    );
    expect(screen.getByTestId("visible-dependent").textContent).toBe("hidden");
  });

  it("runs sync validation on setValue", async () => {
    const user = userEvent.setup();
    render(
      <Settera schema={schema} values={{ name: "sam" }} onChange={() => {}}>
        <SettingDisplay settingKey="name" />
      </Settera>,
    );
    await user.click(screen.getByTestId("clear-name"));
    expect(screen.getByTestId("error-name").textContent).toBe(
      "This field is required",
    );
  });
});

// ---- Async save tracking ----

function SaveStatusConsumer() {
  const store = React.useContext(SetteraValuesContext);
  if (!store) return <div>no context</div>;
  return <SaveStatusConsumerInner store={store} />;
}

function SaveStatusConsumerInner({
  store,
}: {
  store: NonNullable<React.ContextType<typeof SetteraValuesContext>>;
}) {
  const saveStatus = useSyncExternalStore(
    store.subscribe,
    () => store.getState().saveStatus,
  );
  return (
    <div>
      <span data-testid="save-status">
        {saveStatus["toggle"] ?? "idle"}
      </span>
      <button onClick={() => store.setValue("toggle", true)}>save</button>
    </div>
  );
}

describe("Settera — async save tracking", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps status idle for sync onChange", () => {
    const onChange = vi.fn();
    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={onChange}>
        <SaveStatusConsumer />
      </Settera>,
    );
    act(() => screen.getByText("save").click());
    expect(screen.getByTestId("save-status").textContent).toBe("idle");
  });

  it("transitions saving → saved → idle for async onChange", async () => {
    let resolveSave!: () => void;
    const onChange = vi.fn(
      () => new Promise<void>((r) => (resolveSave = r)),
    );

    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={onChange}>
        <SaveStatusConsumer />
      </Settera>,
    );

    act(() => screen.getByText("save").click());
    expect(screen.getByTestId("save-status").textContent).toBe("saving");

    await act(async () => resolveSave());
    expect(screen.getByTestId("save-status").textContent).toBe("saved");

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByTestId("save-status").textContent).toBe("idle");
  });

  it("transitions to error on rejection", async () => {
    let rejectSave!: (err: Error) => void;
    const onChange = vi.fn(
      () => new Promise<void>((_r, rej) => (rejectSave = rej)),
    );

    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={onChange}>
        <SaveStatusConsumer />
      </Settera>,
    );

    act(() => screen.getByText("save").click());
    expect(screen.getByTestId("save-status").textContent).toBe("saving");

    await act(async () => rejectSave(new Error("fail")));
    expect(screen.getByTestId("save-status").textContent).toBe("error");
  });

  it("only latest save wins (race condition)", async () => {
    const resolvers: Array<() => void> = [];
    const onChange = vi.fn(
      () => new Promise<void>((r) => resolvers.push(r)),
    );

    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={onChange}>
        <SaveStatusConsumer />
      </Settera>,
    );

    // First save
    act(() => screen.getByText("save").click());
    // Second save
    act(() => screen.getByText("save").click());
    expect(resolvers).toHaveLength(2);

    // Resolve first save — should be ignored since second is newer
    await act(async () => resolvers[0]());
    expect(screen.getByTestId("save-status").textContent).toBe("saving");

    // Resolve second save — this one takes effect
    await act(async () => resolvers[1]());
    expect(screen.getByTestId("save-status").textContent).toBe("saved");
  });

  it("void onChange still works (backward compatible)", () => {
    const onChange = vi.fn(() => undefined);
    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={onChange}>
        <SaveStatusConsumer />
      </Settera>,
    );
    act(() => screen.getByText("save").click());
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByTestId("save-status").textContent).toBe("idle");
  });
});
