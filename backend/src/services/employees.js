import bcrypt from 'bcryptjs';

export default function employeesService() {
  return {
    /**
     * beforeCreate: Hash the password inside authInfo before saving a new employee.
     */
    async beforeCreate({ body }) {
      if (body?.authInfo?.password) {
        const salt = await bcrypt.genSalt(12);
        body.authInfo.password = await bcrypt.hash(body.authInfo.password, salt);
      }
    },

    /**
     * beforeUpdate: If password is being updated, hash it before saving.
     */
    async beforeUpdate({ body }) {
      if (body?.authInfo?.password) {
        const salt = await bcrypt.genSalt(12);
        body.authInfo.password = await bcrypt.hash(body.authInfo.password, salt);
      }
    }
  };
}
