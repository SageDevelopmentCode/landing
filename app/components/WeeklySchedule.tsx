export default function WeeklySchedule() {
  const timeBlocks = [
    {
      time: "Morning",
      label: "Core learning & foundational subjects",
      bgColor: "bg-primary/10",
      textColor: "text-primary",
    },
    {
      time: "Afternoon",
      label: "Enrichment block (STEAM, art, nature studies, movement)",
      bgColor: "bg-primary/20",
      textColor: "text-primary",
    },
    {
      time: "Extended Learning",
      label: "Optional",
      bgColor: "bg-gray-50",
      textColor: "text-gray-600",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Monday - Thursday Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Day Header */}
        <div className="mb-4">
          <h4 className="text-xl font-bold text-black font-heading">
            Monday - Thursday
          </h4>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {timeBlocks.map((block, blockIndex) => (
            <div
              key={blockIndex}
              className={`${block.bgColor} rounded-lg p-4 border-l-4 border-primary`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-[100px]">
                  <span
                    className={`text-sm font-semibold ${block.textColor} font-body`}
                  >
                    {block.time}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-gray font-body">
                    {block.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fun Friday Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Day Header */}
        <div className="mb-4">
          <h4 className="text-xl font-bold text-black font-heading">
            <span className="text-primary font-heading">Field </span>Day Friday
          </h4>
        </div>

        {/* Time Block */}
        <div className="bg-primary/10 rounded-lg p-4 border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <div className="min-w-[100px]">
              <span className="text-sm font-semibold text-primary font-body">
                9-1 pm
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-gray font-body">
                Every Field Day Friday is an unique, outdoor experience!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
