import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { uploadToPresignedUrl } from "../src/lib/api/mediaUpload";
import { ImageAndVideo } from "../src/components/Message/ImageAndVideo";

describe("Client Upload Pipeline & Circular Progress Ring Seam", () => {
  it("uploadToPresignedUrl executes XMLHttpRequest PUT and dispatches progress updates", async () => {
    const progressSpy = vi.fn();
    const fakeFile = new File(["dummy buffer content"], "photo.jpg", {
      type: "image/jpeg",
    });

    // Mock XMLHttpRequest
    const mockXHR = {
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(function (this: any) {
        // Simulate progress event
        if (this.upload.onprogress) {
          this.upload.onprogress({
            lengthComputable: true,
            loaded: 50,
            total: 100,
          });
        }
        // Simulate completion
        this.status = 200;
        this.onload?.();
      }),
      upload: {
        onprogress: null as any,
      },
      status: 200,
      onload: null as any,
      onerror: null as any,
    };

    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = vi.fn(() => mockXHR) as any;

    await uploadToPresignedUrl("https://storage.example.com/chats/123/photo.jpg", fakeFile, progressSpy);

    expect(mockXHR.open).toHaveBeenCalledWith("PUT", "https://storage.example.com/chats/123/photo.jpg");
    expect(mockXHR.setRequestHeader).toHaveBeenCalledWith("Content-Type", "image/jpeg");
    expect(progressSpy).toHaveBeenCalledWith(50);

    window.XMLHttpRequest = originalXHR;
  });

  it("renders circular progress ring overlay when uploadProgress is less than 100", () => {
    const { rerender } = render(
      <ImageAndVideo
        type="image"
        src="blob:http://localhost/preview"
        orientation="landscape"
        duration={null}
        uploadProgress={45}
      />
    );

    const progressRing = screen.getByTestId("circular-progress-ring");
    expect(progressRing).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();

    // Rerender after upload completes
    rerender(
      <ImageAndVideo
        type="image"
        src="https://storage.example.com/chats/123/photo.jpg"
        orientation="landscape"
        duration={null}
        uploadProgress={undefined}
      />
    );

    expect(screen.queryByTestId("circular-progress-ring")).not.toBeInTheDocument();
  });

  it("SaveEditorPlugin invokes the latest onSave callback when files state updates after mount", async () => {
    const { LexicalComposer } = await import("@lexical/react/LexicalComposer");
    const { RichTextPlugin } = await import("@lexical/react/LexicalRichTextPlugin");
    const { ContentEditable } = await import("@lexical/react/LexicalContentEditable");
    const LexicalErrorBoundary = (await import("@lexical/react/LexicalErrorBoundary")).default;
    const { useLexicalComposerContext } = await import("@lexical/react/LexicalComposerContext");
    const { SaveEditorPlugin, SAVE_EDITOR_COMMAND } = await import("../src/editor/plugins/SaveEditorPlugin");
    const { baseConfig } = await import("../src/editor/baseConfig");

    const initialOnSave = vi.fn();
    const updatedOnSave = vi.fn();

    function TriggerButton() {
      const [editor] = useLexicalComposerContext();
      return (
        <button
          data-testid="trigger-save"
          onClick={() => editor.dispatchCommand(SAVE_EDITOR_COMMAND, undefined)}
        >
          Trigger
        </button>
      );
    }

    const { rerender } = render(
      <LexicalComposer initialConfig={{ ...baseConfig, namespace: "TestSave" }}>
        <RichTextPlugin
          contentEditable={<ContentEditable />}
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <SaveEditorPlugin onSave={initialOnSave} />
        <TriggerButton />
      </LexicalComposer>
    );

    // Rerender with updated onSave (simulating files added to Editor context)
    rerender(
      <LexicalComposer initialConfig={{ ...baseConfig, namespace: "TestSave" }}>
        <RichTextPlugin
          contentEditable={<ContentEditable />}
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <SaveEditorPlugin onSave={updatedOnSave} />
        <TriggerButton />
      </LexicalComposer>
    );

    screen.getByTestId("trigger-save").click();

    expect(updatedOnSave).toHaveBeenCalledTimes(1);
    expect(initialOnSave).not.toHaveBeenCalled();
  });
});
