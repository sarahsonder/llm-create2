import React, { useState, useEffect } from "react";
import type { SelectAllQuestion } from "../../../types";

interface Props {
  question: SelectAllQuestion;
  value: string[]; // selected item ids
  onChange: (id: string, value: string[]) => void;
}

const SelectAll: React.FC<Props> = ({ question, value = [], onChange }) => {
  const [selected, setSelected] = useState<string[]>(value || []);

  useEffect(() => {
    // keep local state in sync if parent updates value
    if (value.join(",") !== selected.join(",")) {
      setSelected(value || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const toggleSelect = (id: string) => {
    const newSelected = selected.includes(id)
      ? selected.filter((v) => v !== id)
      : [...selected, id];

    setSelected(newSelected);
    onChange(question.id, newSelected);
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    if (question.defaultExpanded && question.defaultExpanded.length > 0) {
      question.defaultExpanded.forEach((id) => (map[id] = true));
    }
    return map;
  });

  const toggleExpanded = (id: string) => {
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
          Select all poems that apply.
        </p>
      </div>

      <div className="space-y-2">
        {question.items.map((item) => {
          const isChecked = selected.includes(item.id);

          return (
            <div
              key={item.id}
              className="border rounded p-3 bg-white flex flex-col"
            >
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelect(item.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-main">{item.title}</span>
                </label>

                {item.content && (
                  <button
                    onClick={() => toggleExpanded(item.id)}
                    className="text-xs text-grey underline hover:opacity-70"
                    type="button"
                  >
                    {expanded[item.id] ? "Close Poem" : "View Poem"}
                  </button>
                )}
              </div>

              {expanded[item.id] && item.content && (
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

export default SelectAll;
