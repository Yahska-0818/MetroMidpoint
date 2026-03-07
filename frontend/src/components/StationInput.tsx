import { useWebHaptics } from "web-haptics/react";
type Props = {
  inputs: string[];
  stations: string[];
  loading: boolean;
  onInputChange: (index: number, value: string) => void;
  onAddPerson: () => void;
  onRemovePerson: (index: number) => void;
  onSwap: () => void;
  onSubmit: () => void;
};
export default function StationInput({
  inputs,
  stations,
  loading,
  onInputChange,
  onAddPerson,
  onRemovePerson,
  onSwap,
  onSubmit,
}: Props) {
  const { trigger } = useWebHaptics();
  return (
    <div className="flex flex-col gap-4 mb-6">
      <datalist id="stations-list">
        {stations.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {inputs.map((val, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            value={val}
            className="flex-1 p-4 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            list="stations-list"
            onChange={(e) => onInputChange(idx, e.target.value)}
            placeholder={`Station ${idx + 1}`}
            disabled={loading}
          />
          {inputs.length > 2 && (
            <button
              onClick={() => {
                onRemovePerson(idx);
                trigger([{ duration: 15 }], { intensity: 0.4 });
              }}
              className="px-5 py-4 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition font-bold"
              disabled={loading}
            >
              X
            </button>
          )}
        </div>
      ))}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => {
            onAddPerson();
            trigger([{ duration: 15 }], { intensity: 0.4 });
          }}
          className="flex-1 py-4 cursor-pointer rounded-lg font-semibold bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-zinc-700 transition"
          disabled={loading}
        >
          Add Person
        </button>
        {inputs.length === 2 && (
          <button
            onClick={() => {
              onSwap();
              trigger([{ duration: 15 }], { intensity: 0.4 });
            }}
            className="flex-1 sm:flex-none px-6 py-4 cursor-pointer rounded-lg font-semibold bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-zinc-700 transition"
            disabled={loading}
          >
            Swap
          </button>
        )}
        <button
          className={`flex-1 py-4 cursor-pointer rounded-lg font-semibold text-white transition ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          onClick={() => {
            onSubmit();
            trigger([{ duration: 15 }], { intensity: 0.4 });
          }}
          disabled={loading}
        >
          {loading ? "Calculating..." : "Find Meetup"}
        </button>
      </div>
    </div>
  );
}
