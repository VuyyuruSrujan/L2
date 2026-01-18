import React from 'react';

const ComplaintTimeline = ({ complaint }) => {
  // Define milestones
  const getMilestones = () => {
    const milestones = [
      {
        id: 1,
        label: 'Complaint Submitted',
        icon: '📝',
        completed: true,
        timestamp: complaint.createdAt,
      },
      {
        id: 2,
        label: 'Taken by Admin',
        icon: '👤',
        completed: complaint.status !== 'open',
        timestamp: complaint.assignedTo?.takenAt,
        adminName: complaint.assignedTo?.adminName,
      },
      {
        id: 3,
        label: 'Assigned to Technician',
        icon: '🔧',
        completed: ['assigned', 'in-progress', 'resolved', 'closed'].includes(complaint.status),
        timestamp: complaint.technicianAssigned?.assignedAt,
        technicianName: complaint.technicianAssigned?.technicianName,
        technicianEmail: complaint.technicianAssigned?.technicianEmail,
        technicianPhone: complaint.technicianAssigned?.technicianPhone,
      },
      {
        id: 4,
        label: 'Work in Progress',
        icon: '⚙️',
        completed: ['in-progress', 'resolved', 'closed'].includes(complaint.status),
        timestamp: null,
      },
      {
        id: 5,
        label: 'Resolved',
        icon: '✅',
        completed: ['resolved', 'closed'].includes(complaint.status),
        timestamp: null,
      },
    ];

    return milestones;
  };

  const milestones = getMilestones();
  const currentMilestoneIndex = milestones.findIndex(m => !m.completed);
  const activeMilestoneIndex = currentMilestoneIndex === -1 ? milestones.length : currentMilestoneIndex;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Complaint Progress</h3>
      
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-0 bottom-0 w-1 bg-gray-200" />
        
        {/* Animated Progress Line */}
        <div 
          className="absolute left-6 top-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 transition-all duration-1000 ease-out"
          style={{ 
            height: `${(activeMilestoneIndex / milestones.length) * 100}%`,
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
          }}
        />

        {/* Milestones */}
        <div className="space-y-8">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="relative flex items-start gap-4">
              {/* Milestone Icon Circle */}
              <div
                className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 transition-all duration-500 ${
                  milestone.completed
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110'
                    : index === activeMilestoneIndex
                    ? 'bg-white border-blue-400 text-blue-600 animate-pulse'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {milestone.completed ? (
                  <span className="text-xl">✓</span>
                ) : (
                  <span className="text-xl">{milestone.icon}</span>
                )}
              </div>

              {/* Milestone Content */}
              <div className="flex-1 pt-1">
                <div className={`font-semibold ${
                  milestone.completed ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {milestone.label}
                </div>
                
                {milestone.completed && milestone.timestamp && (
                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(milestone.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}

                {milestone.adminName && (
                  <div className="text-sm text-blue-700 mt-1 font-medium">
                    Admin: {milestone.adminName}
                  </div>
                )}

                {milestone.technicianName && (
                  <div className="text-sm text-green-700 mt-1 font-medium">
                    Technician: {milestone.technicianName}
                  </div>
                )}

                {milestone.technicianEmail && (
                  <div className="text-xs text-gray-600 mt-1">
                    Email: {milestone.technicianEmail}
                  </div>
                )}

                {milestone.technicianPhone && (
                  <div className="text-xs text-gray-600 mt-0.5">
                    Phone: {milestone.technicianPhone}
                  </div>
                )}

                {!milestone.completed && index === activeMilestoneIndex && (
                  <div className="text-sm text-yellow-600 mt-1 font-medium animate-pulse">
                    ⏳ In progress...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Summary Card */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">Current Status</div>
            <div className="text-lg font-bold text-gray-900 capitalize">
              {complaint.status === 'taken' ? 'Taken by Admin' : complaint.status.replace('-', ' ')}
            </div>
          </div>
          <div className="text-3xl">
            {complaint.status === 'open' && '📋'}
            {complaint.status === 'taken' && '👤'}
            {complaint.status === 'assigned' && '🔧'}
            {complaint.status === 'in-progress' && '⚙️'}
            {complaint.status === 'resolved' && '✅'}
            {complaint.status === 'closed' && '🎉'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintTimeline;
