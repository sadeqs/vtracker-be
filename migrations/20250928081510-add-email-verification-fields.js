'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add isVerified column
    await queryInterface.addColumn('Users', 'isVerified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Add verificationToken column
    await queryInterface.addColumn('Users', 'verificationToken', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove verificationToken column
    await queryInterface.removeColumn('Users', 'verificationToken');
    
    // Remove isVerified column
    await queryInterface.removeColumn('Users', 'isVerified');
  },
};