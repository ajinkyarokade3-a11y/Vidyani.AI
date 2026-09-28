import { Library } from "lucide-react";

type ResourceListProps = {
  resources: string[];
};

export function ResourceList({ resources }: ResourceListProps) {
  if (resources.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Library className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <h4 className="text-sm font-semibold text-slate-950">
          Recommended Resources
        </h4>
      </div>
      <div className="flex flex-wrap gap-2">
        {resources.map((resource) => (
          <span
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
            key={resource}
          >
            {resource}
          </span>
        ))}
      </div>
    </div>
  );
}
