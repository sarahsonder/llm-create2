import React from "react";
import { RadioGroup } from "@chakra-ui/react"; // keep Radix RadioGroup
import type { CircularMultipleChoiceQuestion } from "../../../types";

interface Props {
  question: CircularMultipleChoiceQuestion;
  value: string;
  onChange: (id: string, value: string) => void;
}

const GenevaWheel: React.FC<Props> = ({ question, value, onChange }) => {
  const radius = 120;
  const indicatorSize = 24;
  const options = question.options;
  const optionCount = options.length;

  // Dynamic start angle for balance
  const startAngleRad = optionCount % 2 === 0 ? Math.PI / optionCount : 0;

  return (
    <div className="mb-4 w-full flex flex-col">
      <span className="text-main mb-16 text-left">
        {question.question}
        {question.required && <span className="text-red-700">*</span>}
      </span>

      <div className="w-full flex flex-col items-center">
        <div
          className="relative"
          style={{
            width: `${radius * 2 + 50}px`,
            height: `${radius * 2 + 100}px`,
          }}
        >
          <RadioGroup.Root
            value={value}
            onValueChange={(e) => onChange(question.id, e.value!)}
            className="absolute top-0 left-0 w-full h-full"
          >
            {options.map((option, index) => {
              const angle =
                (index / optionCount) * 2 * Math.PI -
                Math.PI / 2 +
                startAngleRad;

              // Position indicator
              const x = radius + radius * Math.cos(angle) - indicatorSize / 2;
              const y = radius + radius * Math.sin(angle) - indicatorSize / 2;

              // Position label outside the circle
              const labelX = radius + (radius + 55) * Math.cos(angle);
              const labelY = radius + (radius + 40) * Math.sin(angle);

              return (
                <React.Fragment key={option}>
                  {/* Indicator */}
                  <div
                    className="absolute flex items-center justify-center"
                    style={{ left: `${x}px`, top: `${y}px` }}
                  >
                    <RadioGroup.Item
                      value={option}
                      className="flex items-center justify-center cursor-pointer"
                      style={{ width: indicatorSize, height: indicatorSize }}
                    >
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator className="border border-light-grey-1 focus:border-grey focus:border-2 rounded-full w-full h-full" />
                    </RadioGroup.Item>
                  </div>

                  {/* Label */}
                  <div
                    className="absolute text-sm text-center w-24 pointer-events-none"
                    style={{
                      left: `${labelX}px`,
                      top: `${labelY}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {option}
                  </div>
                </React.Fragment>
              );
            })}
          </RadioGroup.Root>
        </div>
      </div>
    </div>
  );
};

export default GenevaWheel;
