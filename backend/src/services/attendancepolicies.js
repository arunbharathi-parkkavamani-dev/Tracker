// services/attendancepolicies.js
export default function attendancepolicies() {
  return {
    beforeCreate: async ({ body }) => {
      if (!body.name) {
        throw new Error("Attendance Policy name is required.");
      }
      return body;
    },
    beforeUpdate: async ({ body }) => {
      return body;
    }
  };
}
