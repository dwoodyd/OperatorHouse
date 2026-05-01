import { useRef, useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, FileSignature, Loader2, XCircle } from "lucide-react";

export default function SignContract() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signed, setSigned] = useState(false);

  const { data, isLoading, error } = trpc.contracts.getByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const sign = trpc.contracts.sign.useMutation({
    onSuccess: () => { setSigned(true); toast.success("Contract signed successfully"); },
    onError: (e) => toast.error(e.message),
  });

  // Canvas drawing
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#f5c842";
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDraw = () => setDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature || !signerName.trim()) return;
    const signatureData = canvas.toDataURL("image/png");
    sign.mutate({ token, signerName: signerName.trim(), signatureData });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-ivory text-xl font-bold mb-2">Link Unavailable</h2>
          <p className="text-zinc-400 text-sm">This signing link is invalid, expired, or has been voided.</p>
        </div>
      </div>
    );
  }

  if (signed || data.alreadySigned) {
    return (
      <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-ivory text-2xl font-bold mb-2">Contract Signed</h2>
          <p className="text-zinc-400 text-sm">
            {data.alreadySigned
              ? "This contract has already been signed."
              : "Thank you. Your signature has been recorded and the operator has been notified."}
          </p>
        </div>
      </div>
    );
  }

  const { contract } = data;

  return (
    <div className="min-h-screen bg-[#0e0c09] text-ivory">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <span className="text-amber-400 text-xs font-bold">OH</span>
          </div>
          <div>
            <p className="text-ivory font-semibold text-sm">Operator House</p>
            <p className="text-zinc-500 text-xs">Electronic Signature</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Contract header */}
        <div className="p-5 bg-zinc-900 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <FileSignature className="w-4 h-4 text-amber-400" />
            <h1 className="text-ivory font-bold text-lg">{contract.title}</h1>
          </div>
          {contract.signerEmail && (
            <p className="text-zinc-500 text-sm">For: {contract.signerEmail}</p>
          )}
        </div>

        {/* Contract body */}
        <div className="p-5 bg-zinc-900 rounded-xl border border-zinc-800">
          <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-4">Contract Terms</h2>
          <pre className="text-zinc-300 text-sm whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
            {contract.body}
          </pre>
        </div>

        {/* Signature section */}
        <div className="p-5 bg-zinc-900 rounded-xl border border-zinc-800 space-y-4">
          <h2 className="text-ivory font-semibold flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-amber-400" />
            Sign Below
          </h2>

          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs">Full Legal Name</Label>
            <Input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Enter your full name"
              className="bg-zinc-800 border-zinc-700 text-ivory"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-400 text-xs">Signature</Label>
              {hasSignature && (
                <button onClick={clearSignature} className="text-zinc-500 text-xs hover:text-zinc-300">
                  Clear
                </button>
              )}
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={150}
                className="w-full touch-none cursor-crosshair"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>
            {!hasSignature && (
              <p className="text-zinc-600 text-xs">Draw your signature above</p>
            )}
          </div>

          <div className="p-3 bg-zinc-800 rounded-lg border border-zinc-700">
            <p className="text-zinc-400 text-xs">
              By signing above, you agree that this electronic signature is legally binding and equivalent to a handwritten signature. You confirm you have read and agree to the terms of this contract.
            </p>
          </div>

          <Button
            onClick={handleSign}
            disabled={!signerName.trim() || !hasSignature || sign.isPending}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            {sign.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" />Sign Contract</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
