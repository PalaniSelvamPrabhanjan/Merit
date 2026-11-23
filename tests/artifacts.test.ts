import { describe, expect, it } from "vitest";
import {
  buildArtifactPreviewUrl,
  detectArtifactType,
  getArtifactDisplayLabel,
  normalizeArtifactUrl,
  resolveArtifactViewer,
  resolveProjectImageGallery,
  resolveProjectViewerSource,
  resolveProjectVisualPreview
} from "@/lib/artifacts";

describe("artifact helpers", () => {
  it("normalizes links by adding protocol", () => {
    expect(normalizeArtifactUrl("example.com")).toBe("https://example.com");
  });

  it("detects common artifact types", () => {
    expect(detectArtifactType("https://github.com/openai/openai-node")).toBe("github");
    expect(detectArtifactType("https://www.figma.com/file/abc")).toBe("figma");
    expect(detectArtifactType("https://site.com/image.png")).toBe("image");
    expect(detectArtifactType("https://files.example.com/assembly.stl")).toBe("model3d");
    expect(detectArtifactType("https://site.com/page")).toBe("website");
  });

  it("returns youtube thumbnail for youtube videos", () => {
    const preview = buildArtifactPreviewUrl("https://youtu.be/dQw4w9WgXcQ", "video");
    expect(preview).toContain("img.youtube.com");
  });

  it("uses chosen cover thumbnail while still keeping web live preview", () => {
    const visual = resolveProjectVisualPreview({
      artifacts: [
        {
          url: "https://example.com",
          type: "website",
          previewUrl: "https://images.example.com/preview.png"
        }
      ],
      coverImageUrl: "https://images.example.com/cover.png",
      projectType: "web"
    });

    expect(visual.previewUrl).toBe("https://images.example.com/cover.png");
    expect(visual.livePreviewUrl).toBe("https://example.com");
    expect(visual.source).toBe("cover");
  });

  it("falls back to cover image when artifact previews are unavailable", () => {
    const visual = resolveProjectVisualPreview({
      artifacts: [
        {
          url: "https://files.example.com/design.dwg",
          type: "document",
          previewUrl: null
        }
      ],
      coverImageUrl: "https://images.example.com/cover.png",
      projectType: "document"
    });

    expect(visual.previewUrl).toBe("https://images.example.com/cover.png");
    expect(visual.source).toBe("cover");
  });

  it("resolves office documents to embeddable Office viewer URLs", () => {
    const viewer = resolveArtifactViewer("https://files.example.com/pitch.pptx", "document");
    expect(viewer.kind).toBe("office");
    expect(viewer.embedUrl).toContain("view.officeapps.live.com");
  });

  it("resolves model files to the in-app 3D viewer mode", () => {
    const viewer = resolveArtifactViewer("https://files.example.com/model.glb", "model3d");
    expect(viewer.kind).toBe("model3d");
    expect(viewer.embedUrl).toBe("https://files.example.com/model.glb");
  });

  it("picks a website artifact first for web projects", () => {
    const source = resolveProjectViewerSource({
      artifacts: [
        {
          url: "https://files.example.com/demo.pdf",
          type: "document",
          previewUrl: null
        },
        {
          url: "https://demo.example.com",
          type: "website",
          previewUrl: "https://images.example.com/web-preview.png"
        }
      ],
      coverImageUrl: "https://images.example.com/fallback-cover.png",
      projectType: "web"
    });

    expect(source.kind).toBe("website");
    expect(source.embedUrl).toBe("https://demo.example.com");
    expect(source.source).toBe("artifact");
  });
});

describe("uploaded artifact labels and gallery dedupe", () => {
  const storage = "https://abc.supabase.co/storage/v1/object/public/project-artifacts/user-1";

  it("labels uploaded files by their original file name, not the storage host", () => {
    expect(getArtifactDisplayLabel(`${storage}/1763880000000-k3j9xq-Final_UI.png`)).toBe("Final_UI.png");
  });

  it("keeps the host label for ordinary links", () => {
    expect(getArtifactDisplayLabel("https://www.figma.com/file/abc")).toBe("figma.com");
  });

  it("drops a gallery image that is the same uploaded file as the cover", () => {
    const gallery = resolveProjectImageGallery({
      coverImageUrl: `${storage}/1763880000001-aaaaaa-final.png`,
      artifacts: [
        { url: `${storage}/1763880000002-bbbbbb-sketch.png`, type: "image", previewUrl: null, label: "sketch.png" },
        { url: `${storage}/1763880000003-cccccc-final.png`, type: "image", previewUrl: null, label: "final.png" }
      ]
    });
    expect(gallery.map((item) => item.label)).toEqual(["Cover image", "sketch.png"]);
  });
});
