import Incident from '../models/incident.model.js'

// 1. GET /api/incidents
export const getAllIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ timestamp: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. PUT /api/incidents/:id/assign
export const assignIncident = async (req, res) => {
  try {
    const { analystName } = req.body;
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { assignedTo: analystName, status: 'In Progress' },
      { new: true }
    );

    req.io.emit('incidentUpdated', incident);
    req.io.emit('dashboardStatsUpdate');

    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. PUT /api/incidents/:id/status
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true }
    );

    req.io.emit('incidentUpdated', incident);
    req.io.emit('dashboardStatsUpdate');

    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    const total = await Incident.countDocuments();
    const open = await Incident.countDocuments({ status: 'Open' });
    const resolved = await Incident.countDocuments({ status: 'Resolved' });
    const critical = await Incident.countDocuments({ severity: 'Critical' });

    res.json({ total, open, resolved, critical });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. GET /api/dashboard/top-ip
export const getTopAttackingIPs = async (req, res) => {
  try {
    const topIps = await Incident.aggregate([
      { $group: { _id: "$sourceIP", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    res.json(topIps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. POST /api/simulate/attack
export const simulateAttack = async (req, res) => {
  const types = ['XSS', 'SQLi', 'DDoS', 'Brute Force'];
  const sevs = ['Low', 'Medium', 'High', 'Critical'];

  const newIncident = new Incident({
    type: types[Math.floor(Math.random() * types.length)],
    severity: sevs[Math.floor(Math.random() * sevs.length)],
    sourceIP: `192.168.1.${Math.floor(Math.random() * 255)}`,
    targetSystem: 'Mainframe'
  });

  await newIncident.save();

  req.io.emit('newIncident', newIncident);
  req.io.emit('dashboardStatsUpdate');

  res.json({ message: "Attack Simulated", incident: newIncident });
};