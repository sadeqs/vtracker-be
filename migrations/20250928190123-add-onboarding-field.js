'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add onboarding column
    await queryInterface.addColumn('Users', 'onboarding', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove onboarding column
    await queryInterface.removeColumn('Users', 'onboarding');
  },
};