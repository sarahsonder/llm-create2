import React, { useState } from "react";
import { Button } from "@chakra-ui/react";
import type { PoemSnapshot } from "../../types";
import { MdOutlineUndo } from "react-icons/md";
import { MdOutlineRedo } from "react-icons/md";

interface BlackoutProps {
  passageText: string;
  selectedWordIndexes: number[];
  setSelectedWordIndexes: React.Dispatch<React.SetStateAction<number[]>>;
  setPoemSnapshots: React.Dispatch<React.SetStateAction<PoemSnapshot[]>>;
}

const BlackoutPoetry: React.FC<BlackoutProps> = ({
  passageText,
  selectedWordIndexes,
  setSelectedWordIndexes,
  setPoemSnapshots,
}) => {
  const words = passageText.split(" ");
  const [historyIndex, setHistoryIndex] = useState<number>(-1); // Track undo/redo position
  const [history, setHistory] = useState<PoemSnapshot[]>([]);

  const toggleSelect = (index: number) => {
    const isSelected = selectedWordIndexes.includes(index);
    const newIndexes = isSelected
      ? selectedWordIndexes.filter((i) => i !== index)
      : [...selectedWordIndexes, index];

    setSelectedWordIndexes(newIndexes);

    const newSnapshot: PoemSnapshot = {
      action: isSelected ? "REMOVE" : "ADD",
      index,
      timestamp: new Date(),
    };
    setPoemSnapshots((prev) => [...prev, newSnapshot]);

    // Update history for undo/redo
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newSnapshot]);
    setHistoryIndex((prev) => prev + 1);
  };

  const undo = () => {
    if (historyIndex < 0) return;

    const snapshot = history[historyIndex];

    setSelectedWordIndexes((prev) => {
      let newIndexes: number[];
      let actionType: "ADD" | "REMOVE";

      if (snapshot.action === "ADD") {
        newIndexes = prev.filter((i) => i !== snapshot.index);
        actionType = "REMOVE";
      } else {
        newIndexes = [...prev, snapshot.index];
        actionType = "ADD";
      }

      // Push to snapshots to record undo
      setPoemSnapshots((prevSnapshots) => [
        ...prevSnapshots,
        {
          action: actionType,
          index: snapshot.index,
          timestamp: new Date(),
        },
      ]);

      return newIndexes;
    });

    setHistoryIndex((prev) => prev - 1);
  };

  const redo = () => {
    if (historyIndex + 1 >= history.length) return;

    const snapshot = history[historyIndex + 1];

    setSelectedWordIndexes((prev) => {
      let newIndexes: number[];
      let actionType: "ADD" | "REMOVE";

      if (snapshot.action === "ADD") {
        newIndexes = [...prev, snapshot.index];
        actionType = "ADD";
      } else {
        newIndexes = prev.filter((i) => i !== snapshot.index);
        actionType = "REMOVE";
      }

      // Push to snapshots to record redo
      setPoemSnapshots((prevSnapshots) => [
        ...prevSnapshots,
        {
          action: actionType,
          index: snapshot.index,
          timestamp: new Date(),
        },
      ]);

      return newIndexes;
    });

    setHistoryIndex((prev) => prev + 1);
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Top Controls */}
      <div className="w-full flex flex-row justify-between">
        <div className="flex flex-row space-x-2">
          <Button
            className="btn-small-inverted"
            onClick={undo}
            disabled={historyIndex < 0}
          >
            <MdOutlineUndo />
            <p className="hidden md:block">Undo</p>
          </Button>
          <Button
            className="btn-small-inverted"
            onClick={redo}
            disabled={historyIndex + 1 >= history.length}
          >
            <MdOutlineRedo />
            <p className="hidden md:block">Redo</p>
          </Button>
        </div>
      </div>

      {/* Two Column View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
        {/* Passage Side */}
        <div
          className="leading-relaxed flex flex-wrap select-none h-max"
          onCopy={(e) => e.preventDefault()}
        >
          {words.map((word, i) => {
            const isSelected = selectedWordIndexes.includes(i);
            const textColor = isSelected
              ? "text-main text-light-grey-1"
              : "text-main hover:text-blue-800 hover:underline";

            return (
              <span
                key={i}
                onClick={() => toggleSelect(i)}
                className={`cursor-pointer transition px-1 duration-200 ${textColor}`}
              >
                {word + " "}
              </span>
            );
          })}
        </div>

        {/* Blackout Preview Side */}
        <div
          className="leading-relaxed flex flex-wrap select-none h-max"
          onCopy={(e) => e.preventDefault()}
        >
          {words.map((word, i) => {
            const isSelected = selectedWordIndexes.includes(i);
            const blackoutStyle = isSelected
              ? "text-main text-dark-grey"
              : "text-main text-dark-grey bg-dark-grey";

            return (
              <span
                key={i}
                className={`px-1 transition duration-200 ${blackoutStyle}`}
              >
                {word + " "}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BlackoutPoetry;
