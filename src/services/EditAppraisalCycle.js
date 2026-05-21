import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

export const cycleById = async (cycle_id) => {
  try {
    const response = await axios.get(
      `${API_URL}/edit-appraisal-cycle/${cycle_id}`
    );
    return response.data;
  } catch (error) {
    console.error('Error in get appraisal cycle by id: ' + error);
    throw error;
  }
};

export const editAppraisalCycle = async (cycleData) => {
  try {
    const response = await axios.put(
      `${API_URL}/edit-appraisal-cycle/${cycleData.cycle_id}`,
      cycleData
    );
    return response.data;
  } catch (error) {
    console.error('Error in edit appraisal cycle: ' + error);
    throw error;
  }
};
