import React, { useRef, useState, useEffect } from "react";
import type { DragRankQuestion } from "../../../types";
import { MdDragIndicator } from "react-icons/md";

interface Props {
  question: DragRankQuestion;
  value: string[]; // ordered list of item ids
  onChange: (id: string, value: string[]) => void;
}

const DragRank: React.FC<Props> = ({ question, value = [], onChange }) => {
  const [order, setOrder] = useState<string[]>(() => {
    if (value && value.length > 0) return value;
    if (question.initialOrder && question.initialOrder.length > 0)
      return question.initialOrder;
    return question.items.map((it) => it.id);
  });

  useEffect(() => {
    // keep local order in sync if parent updates value
    if (value && value.length > 0 && value.join(",") !== order.join(",")) {
      setOrder(value);
      console.log("Syncing order from props value", value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const draggingIndex = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    draggingIndex.current = idx;
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", String(idx));
    } catch (err) {
      // Some browsers may throw if setData isn't allowed
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const from = draggingIndex.current;
    if (from === null || from === undefined) return;
    if (from === dropIndex) return;

    const newOrder = [...order];
    const [moved] = newOrder.splice(from, 1);
    newOrder.splice(dropIndex, 0, moved);
    setOrder(newOrder);
    onChange(question.id, newOrder);
    draggingIndex.current = null;
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    if (question.defaultExpanded && question.defaultExpanded.length > 0) {
      question.defaultExpanded.forEach((id) => (map[id] = true));
    }
    return map;
  });

  const toggleExpanded = (id: string) => {
    if (!expanded[id]) {
      const newOrder = [...order];
      setOrder(newOrder);
      onChange(question.id, newOrder);
      draggingIndex.current = null;
    }
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const itemById = (id: string) =>
    question.items.find((it) => it.id === id) || {
      id,
      title: id,
      content: null,
    };

  return (
    <div className="mb-4 space-y-3">
      <div>
        <p className="text-main">
          {question.question}
          <span className="text-red-700">{question.required ? "*" : ""}</span>
        </p>
        <p className="text-sm text-sub py-4 italic">
          To rank the poems, drag and drop each poem.
        </p>
      </div>

      <div className="space-y-2">
        {order.map((id, idx) => {
          const item = itemById(id);
          return (
            <div
              key={id}
              draggable={question.draggable !== false}
              onDragStart={
                question.draggable === false
                  ? undefined
                  : (e) => handleDragStart(e, idx)
              }
              onDragOver={
                question.draggable === false ? undefined : handleDragOver
              }
              onDrop={
                question.draggable === false
                  ? undefined
                  : (e) => handleDrop(e, idx)
              }
              className="border rounded p-3 bg-white flex flex-col"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded">
                    <span className="text-sm">{idx + 1}</span>
                  </div>
                  <div className="text-main">{item.title}</div>
                </div>
                <div className="flex items-center gap-2">
                  {item.content && (
                    <button
                      onClick={() => toggleExpanded(id)}
                      className="text-xs text-grey underline hover:opacity-70"
                      type="button"
                    >
                      {expanded[id] ? "Close Poem" : "View Poem"}
                    </button>
                  )}
                  <div className="text-light-grey-2">
                    <MdDragIndicator />
                  </div>
                </div>
              </div>

              {expanded[id] && item.content && (
                <div className="mt-2 text-sm text-sub flex justify-center">
                  {item.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DragRank;
