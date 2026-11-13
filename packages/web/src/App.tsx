import {
  createNetworkClient,
  formatMarkdown,
  type LintReport,
  type Severity,
} from "@nft-lint/core";
import { lint } from "@nft-lint/preset";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const CID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

const validSample = {
  name: "Glass Finch",
  description: "Kiln-fired glass bird, one of twelve.",
  image: `ipfs://${CID}/1.png`,
  external_url: "https://gallery.example/finch/1",
  background_color: "e8dcc8",
  attributes: [
    { trait_type: "Plumage", value: "Amber" },
    { trait_type: "Edition", display_type: "number", value: 1 },
  ],
};

const brokenSample = {
  name: "Glass Finch",
  description: "",
  image: "https://gateway.pinata.cloud/ipfs/not-a-cid/1.png",
  background_color: "#e8dcc8",
  animation_url: "nope",
  attributes: [
    { trait_type: "Plumage", value: "Amber" },
    { trait_type: "Plumage", value: "" },
    { trait_type: "Hatched", display_type: "date", value: 1700000000000 },
  ],
};

const chains = [
  "Ethereum",
  "Base",
  "Arbitrum",
  "OP Mainnet",
  "BNB Chain",
  "Avalanche",
  "Robinhood Chain",
  "Polygon",
  "ApeChain",
  "Solana",
];

export function App() {
  const [tab, setTab] = useState("json");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [checkMedia, setCheckMedia] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<LintReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const network = useMemo(
    () => createNetworkClient({ timeoutMs: 12_000, maxBytes: 2 * 1024 * 1024 }),
    [],
  );

  async function run(input: string) {
    const trimmed = input.trim();
    if (!trimmed) {
      setReport(null);
      setError("Paste metadata JSON or a URI first.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const next = await lint(trimmed, {
        env: {},
        offline: !checkMedia,
        network,
      });
      setReport(next);
      setStatus("done");
    } catch (cause) {
      setReport(null);
      setError(cause instanceof Error ? cause.message : "Lint failed.");
      setStatus("error");
    }
  }

  function copyReport() {
    if (!report) return;
    const markdown = formatMarkdown(report);
    let settled = false;
    const reveal = () => {
      if (settled) return;
      settled = true;
      setCopied(false);
      setCopyFallback(markdown);
    };
    const timer = window.setTimeout(reveal, 250);
    const done = navigator.clipboard?.writeText(markdown);
    if (!done) {
      window.clearTimeout(timer);
      reveal();
      return;
    }
    void done
      .then(() => {
        settled = true;
        window.clearTimeout(timer);
        setCopyFallback(null);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => {
        window.clearTimeout(timer);
        reveal();
      });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-6">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-rule">PROOF BEFORE MINT</p>
            <h1 className="font-serif text-4xl leading-none sm:text-5xl">NFT Lint</h1>
          </div>
          <a
            className="text-sm font-semibold underline decoration-ink/30 underline-offset-4"
            href="https://github.com/charvelchedraui/nft-lint"
          >
            charvelchedraui/nft-lint
          </a>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <p className="max-w-prose text-lg leading-snug">
            Catch broken images, bad attributes, and metadata a marketplace will ignore. The same
            checks run in this page, in the <code className="font-mono text-base">nft-lint</code>{" "}
            CLI, and in CI.
          </p>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList aria-label="Input type">
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
            </TabsList>
            <TabsContent value="json">
              <label className="mb-2 block text-sm font-semibold" htmlFor="metadata">
                Metadata JSON
              </label>
              <Textarea
                id="metadata"
                value={text}
                spellCheck={false}
                placeholder='{"name":"Glass Finch","description":"...","image":"ipfs://..."}'
                onChange={(event) => setText(event.target.value)}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setText(JSON.stringify(validSample, null, 2))}
                >
                  Load a valid ERC-721
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setText(JSON.stringify(brokenSample, null, 2))}
                >
                  Load a broken one
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="url">
              <label className="mb-2 block text-sm font-semibold" htmlFor="uri">
                Metadata URI
              </label>
              <Input
                id="uri"
                value={url}
                placeholder="ipfs://... or https://..."
                onChange={(event) => setUrl(event.target.value)}
              />
              <p className="mt-2 text-sm text-ink/70">
                IPFS and Arweave URIs are fetched through public gateways. If a host blocks the
                browser, paste the JSON instead. Chain reads (contract and token id) stay in the
                CLI, where an RPC can be set without a CORS proxy.
              </p>
            </TabsContent>
          </Tabs>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={checkMedia}
              onChange={(event) => setCheckMedia(event.target.checked)}
            />
            Check that image and animation URLs load
          </label>
          <Button
            type="button"
            onClick={() => void run(tab === "json" ? text : url)}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Checking…" : "Lint metadata"}
          </Button>
        </section>
        <section
          className="min-h-80 rounded-lg border border-ink/10 bg-white/70 p-4"
          aria-live="polite"
        >
          {status === "idle" && <Empty />}
          {status === "loading" && <p className="font-mono text-sm">Reading metadata…</p>}
          {status === "error" && error && (
            <p className="text-rule" role="alert">
              {error}
            </p>
          )}
          {status === "done" && report && (
            <ReportView
              report={report}
              copied={copied}
              fallback={copyFallback}
              onCopy={() => void copyReport()}
            />
          )}
        </section>
      </main>
      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-ink/70">
          <p>v1 chains: {chains.join(" · ")}</p>
          <p>
            Apache-2.0. Nothing you paste is uploaded to a lint server. Fetches go to the URI you
            provide.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <div>
        <h2 className="font-serif text-2xl">Nothing checked yet</h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink/80">
          Paste a token JSON file or a metadata URI. You will get a rule id, a JSON path, and a
          sentence you can act on. Offline checks cover required fields, attributes, IPFS and
          Arweave URIs, and royalty shape. Turn on media checks when you want the bytes fetched.
        </p>
      </div>
      <p className="font-mono text-xs text-ink/50">Waiting for input</p>
    </div>
  );
}

function ReportView({
  report,
  copied,
  fallback,
  onCopy,
}: {
  report: LintReport;
  copied: boolean;
  fallback: string | null;
  onCopy: () => void;
}) {
  const tone = report.summary.errors > 0 ? "error" : report.summary.warnings > 0 ? "warn" : "ok";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Badge tone={tone}>{report.summary.errors} errors</Badge>
          <Badge tone="warn">{report.summary.warnings} warnings</Badge>
          <Badge tone="info">{report.summary.infos} infos</Badge>
          <Badge>{report.standard}</Badge>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onCopy}>
          {copied ? "Copied" : fallback ? "Select the report below" : "Copy report as Markdown"}
        </Button>
      </div>
      {fallback && (
        <textarea
          readOnly
          aria-label="Markdown report"
          className="min-h-40 w-full rounded-md border border-ink/20 bg-white p-2 font-mono text-xs"
          value={fallback}
          onFocus={(event) => event.currentTarget.select()}
        />
      )}
      {report.findings.length === 0 ? (
        <p className="text-ok">No findings. This document passes the checks that ran.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {report.findings.map((finding, index) => (
            <li
              key={`${finding.ruleId}-${finding.path}-${index}`}
              className="border-t border-ink/10 pt-3"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <Badge tone={badgeTone(finding.severity)}>{finding.severity}</Badge>
                <span className="font-mono text-xs">{finding.ruleId}</span>
                {finding.path && (
                  <span className="font-mono text-xs text-ink/60">{finding.path}</span>
                )}
              </div>
              <p className="mt-1 text-sm">{finding.message}</p>
              <a className="text-xs underline decoration-ink/30" href={finding.docs}>
                Rule docs
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function badgeTone(severity: Severity): "error" | "warn" | "info" {
  if (severity === "error") return "error";
  if (severity === "warn") return "warn";
  return "info";
}
