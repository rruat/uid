import React, { useEffect, useRef } from "react";
import { useProject } from "../../state/ProjectContext";
import { Icon } from "../Icon";
import { createId } from "../../model/id";
import "./rulers.css";

interface RulersProps {
  transform: { x: number; y: number; scale: number };
  onOpenGuidesPanel?: () => void;
}

export function Rulers({ transform, onOpenGuidesPanel }: RulersProps) {
  const { state, dispatch } = useProject();
  const showRulers = state.present.settings.showRulers !== false;

  const hCanvasRef = useRef<HTMLCanvasElement>(null);
  const vCanvasRef = useRef<HTMLCanvasElement>(null);

  // Draw Horizontal Ruler
  useEffect(() => {
    if (!showRulers || !hCanvasRef.current) return;
    const canvas = hCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#8a8d98";
    ctx.strokeStyle = "#c8cbd4";
    ctx.font = "9px monospace";
    ctx.lineWidth = 1;

    const scale = transform.scale;
    const originX = transform.x;

    // Start coordinate on artboard
    const startArtboardX = Math.floor(-originX / scale / 10) * 10;
    const endArtboardX = Math.ceil((rect.width - originX) / scale / 10) * 10;

    for (let pos = startArtboardX; pos <= endArtboardX; pos += 10) {
      const screenX = originX + pos * scale;
      if (screenX < 0 || screenX > rect.width) continue;

      const is100 = pos % 100 === 0;
      const is50 = pos % 50 === 0;
      const tickH = is100 ? 10 : is50 ? 6 : 3;

      ctx.beginPath();
      ctx.moveTo(Math.round(screenX) + 0.5, rect.height - tickH);
      ctx.lineTo(Math.round(screenX) + 0.5, rect.height);
      ctx.stroke();

      if (is100 && scale >= 0.5) {
        ctx.fillText(`${pos}`, screenX + 3, 11);
      }
    }
  }, [transform, showRulers]);

  // Draw Vertical Ruler
  useEffect(() => {
    if (!showRulers || !vCanvasRef.current) return;
    const canvas = vCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#8a8d98";
    ctx.strokeStyle = "#c8cbd4";
    ctx.font = "9px monospace";
    ctx.lineWidth = 1;

    const scale = transform.scale;
    const originY = transform.y;

    const startArtboardY = Math.floor(-originY / scale / 10) * 10;
    const endArtboardY = Math.ceil((rect.height - originY) / scale / 10) * 10;

    for (let pos = startArtboardY; pos <= endArtboardY; pos += 10) {
      const screenY = originY + pos * scale;
      if (screenY < 0 || screenY > rect.height) continue;

      const is100 = pos % 100 === 0;
      const is50 = pos % 50 === 0;
      const tickW = is100 ? 10 : is50 ? 6 : 3;

      ctx.beginPath();
      ctx.moveTo(rect.width - tickW, Math.round(screenY) + 0.5);
      ctx.lineTo(rect.width, Math.round(screenY) + 0.5);
      ctx.stroke();

      if (is100 && scale >= 0.5) {
        ctx.save();
        ctx.translate(11, screenY - 3);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${pos}`, 0, 0);
        ctx.restore();
      }
    }
  }, [transform, showRulers]);

  if (!showRulers) return null;

  // Pointer down on horizontal ruler -> create vertical guide (X) and drag immediately onto canvas
  const handleHorizontalPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const initialPos = Math.round((clickX - transform.x) / transform.scale);

    const guideSets = state.present.guideSets || [];
    const targetSet = guideSets.find((s) => s.visible) || guideSets[0];
    if (!targetSet) return;

    const newGuideId = createId("guide");
    dispatch({
      type: "ADD_CUSTOM_GUIDE",
      guideSetId: targetSet.id,
      guide: {
        id: newGuideId,
        type: "x",
        pos: Math.max(0, initialPos),
      },
    });

    const onPointerMove = (moveEv: PointerEvent) => {
      const currentClickX = moveEv.clientX - rect.left;
      const nextPos = Math.round((currentClickX - transform.x) / transform.scale);
      dispatch({
        type: "UPDATE_CUSTOM_GUIDE",
        guideSetId: targetSet.id,
        guideId: newGuideId,
        pos: Math.max(0, nextPos),
      });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Pointer down on vertical ruler -> create horizontal guide (Y) and drag immediately onto canvas
  const handleVerticalPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const initialPos = Math.round((clickY - transform.y) / transform.scale);

    const guideSets = state.present.guideSets || [];
    const targetSet = guideSets.find((s) => s.visible) || guideSets[0];
    if (!targetSet) return;

    const newGuideId = createId("guide");
    dispatch({
      type: "ADD_CUSTOM_GUIDE",
      guideSetId: targetSet.id,
      guide: {
        id: newGuideId,
        type: "y",
        pos: Math.max(0, initialPos),
      },
    });

    const onPointerMove = (moveEv: PointerEvent) => {
      const currentClickY = moveEv.clientY - rect.top;
      const nextPos = Math.round((currentClickY - transform.y) / transform.scale);
      dispatch({
        type: "UPDATE_CUSTOM_GUIDE",
        guideSetId: targetSet.id,
        guideId: newGuideId,
        pos: Math.max(0, nextPos),
      });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div className="canvas-ruler-root" aria-hidden="true">
      {/* Corner Button */}
      <button
        type="button"
        className="canvas-ruler-corner"
        onClick={onOpenGuidesPanel}
        title="Configurar Réguas, Grades e Guias"
      >
        <Icon name="ruler" size={13} />
      </button>

      {/* Horizontal Top Ruler */}
      <div
        className="canvas-ruler canvas-ruler--horizontal"
        onPointerDown={handleHorizontalPointerDown}
        title="Clique ou arraste para posicionar uma Guia Vertical"
      >
        <canvas ref={hCanvasRef} className="canvas-ruler-canvas" />
      </div>

      {/* Vertical Left Ruler */}
      <div
        className="canvas-ruler canvas-ruler--vertical"
        onPointerDown={handleVerticalPointerDown}
        title="Clique ou arraste para posicionar uma Guia Horizontal"
      >
        <canvas ref={vCanvasRef} className="canvas-ruler-canvas" />
      </div>
    </div>
  );
}
