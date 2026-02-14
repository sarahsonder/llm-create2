import React, { useState } from "react";
import type { MultipleChoiceQuestion } from "../../../types";
import { RadioGroup } from "@chakra-ui/react";

interface Props {
  question: MultipleChoiceQuestion;
  value: string;
  onChange: (id: string, value: string) => void;
}

const MultipleChoice: React.FC<Props> = ({ question, value, onChange }) => {
  return (
    <div className="mb-4 w-full flex flex-col space-y-4">
      <div className="flex justify-start w-full">
        <p className="text-main">
          {" "}
          {question.question}
          <span className="text-red-700">{question.required ? "*" : ""}</span>
        </p>
        {question.children && (
          <div className="ml-2">
            <CollapsibleChildren childrenNode={question.children} />
          </div>
        )}
      </div>

      <RadioGroup.Root
        value={value}
        onValueChange={(e) => onChange(question.id, e.value!)}
        className="flex flex-col gap-4 font-light"
      >
        {question.options.map((opt) => (
          <RadioGroup.Item
            key={opt}
            value={opt}
            className="flex items-center gap-2 cursor-pointer"
          >
            <RadioGroup.ItemHiddenInput />
            <RadioGroup.ItemIndicator className="border border-light-grey-1 focus:border-grey focus:border-2" />
            <RadioGroup.ItemText className="text-sub font-light">
              {opt}
            </RadioGroup.ItemText>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  );
};

export default MultipleChoice;

const CollapsibleChildren: React.FC<{ childrenNode: React.ReactNode }> = ({
  childrenNode,
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-2 w-full">
      <button
        type="button"
        onClick={() => setExpanded((s) => !s)}
        className="text-xs text-grey underline hover:opacity-70"
      >
        {expanded ? "Close Poem" : "Show Poem"}
      </button>
      {expanded && <div className="mt-2 ">{childrenNode}</div>}
    </div>
  );
};
