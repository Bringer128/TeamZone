
function SettingFactory() {
    ///
    /// Returns the settings for verifying a user
    ///
    this.mailVerifySettings = function()
    {
        console.log('Returning mail settings from factory');
        return {
            fromEmailAddress: 'info@aboutagile.com',
            baseUrl: 'https://teamzone-teamzone.c9.io/verifyReg',
            mailServiceName: 'smtp.mailgun.org',
            mailServiceUserName: 'postmaster@mg.aboutagile.com',
            mailServiceUserPassword: '52aad74a88ef82c7bac23c9632ed6592'
        };    
    }
    
}

module.exports = SettingFactory;