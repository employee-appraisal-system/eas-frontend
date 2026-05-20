import axios from 'axios';
const API_URL = process.env.REACT_APP_BASE_URL;

export const activeCycles = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/appraisal_cycle/appraisal-cycles/self-assessment-report`
    );
    return response.data;
  } catch (error) {
    console.error('Error in get appraisal cycle by id: ' + error);
    throw error;
  }
};

export const getCylceResponses = async (cycle_id) => {
  try {
    const response = await axios.get(
      `${API_URL}/self-assessment-report/${cycle_id}`
    );
    return response.data;
  } catch (error) {
    console.error('Error in get response by cycle id: ' + error);
    throw error;
  }
};

export const getEmpList = async () => {
  try {
    const response = await axios.get(`${API_URL}/employees`);
    return response.data;
  } catch (error) {
    console.error('Error in get employees: ' + error);
    throw error;
  }
};
