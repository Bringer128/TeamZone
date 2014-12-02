var assert = require('assert'); // built-in node lib
var async = require('async')
var levelcache = require('level-cache');
var sinon = require('sinon');
var bcrypt = require('bcrypt');
var emailverifyservice = require('../EmailVerifyService');
var createError = require('errno').create;
require('mocha-sinon');
var proxyquire =  require('proxyquire');
var token = require('token');
var usermanagementservice = require('../UserManagementService');

///
/// This is an example of TestFixture per Class
/// However this has two features - Login, Register
/// TestClass per Feature could make this more readable?  It's an open question
///
describe("User Management Service Unit Tests", function() {

  var imdb;
  var levelimdb;
  var stubCompareCrypt;
  var stubCreateCrypt;
  var ums;
  var spyCallback;
  var stubGet;
  var stubPut;
  var sandbox;
  var user;
  var password;
  var surname;
  var firstname;
  var errorNotFound;
  var stubSendVerifyEmail;
  var stubTokenVerify;
  var stubTokenGenerate;
  var evs;
  var tokenGenerated;
  var expectedValue;
  var $jsInject;
  
  /// Stuff that only needs to be initialised once
  before(function() {
      // default mocked values for the tests.
      user = 'john@mu.co.uk';
      password = 'FergusonTheGreatest';
      firstname = 'John';
      surname = 'Ferguson';
      tokenGenerated = 'A-token-to-send-to-the-registering-user';
      
      var NotFoundError = createError('NotFoundError');
      NotFoundError.prototype.notFound = true;
      errorNotFound = new NotFoundError();
  })
  
  //Stuff that need injecting every test run
  beforeEach(function()  {
      expectedValue = { password: 'hashedPassword', firstname: firstname, surname: surname, email: user, confirmed: true, loggedIn: true};

      //sandbox to cleanup global spies
      sandbox = sinon.sandbox.create();
      stubCompareCrypt = sandbox.stub(bcrypt, 'compare');
      stubCreateCrypt = sandbox.stub(bcrypt, 'hash');
      spyCallback = sandbox.spy();
      stubGet = sandbox.stub(levelimdb, 'get');
      stubPut = sandbox.stub(levelimdb, 'put');
      stubSendVerifyEmail = sandbox.stub(evs, 'send');
      stubTokenVerify = sandbox.stub(token, 'verify');
      stubTokenGenerate = sandbox.stub(token, 'generate');
      
      stubGet.yields(null, expectedValue);
      stubCompareCrypt.yields(null, true);
      stubCreateCrypt.yields(null, expectedValue.password);
      stubPut.yields();
      stubTokenVerify.returns(true);
      stubSendVerifyEmail.yields();
      stubTokenGenerate.returns(tokenGenerated);

      //Setup that is used across all tests
      injectDependenciesForUserManagementService();      
  });

  function injectDependenciesForUserManagementService()  {

      //use in memory db, some calls are mocked anyway - but this makes it easier anyway
      imdb = levelcache();
      levelimdb = levelcache();
      evs = new emailverifyservice();


      //ums = proxyquire()
  }

  afterEach(function()  {
    sandbox.restore();
  })
  
  it("Should validate login credentials", function(done) {
      //1. Setup
      // Nothing additional to set up
      
      //2. Exercise
      ums.LoginUser(user, password, spyCallback);
      
      //3. Verify
      assertLoginWasValidatedSuccessfully();
      
      //4. Teardown
      //Nothing to tear down
      done();
  });

  it("An unconfirmed user should be prevented from logging in", function(done) {
      //1. Setup
      expectedValue = { password: 'hashedPassword', email: user, confirmed: false};
      stubGet.yields(null, expectedValue);
      
      //2. Exercise
      ums.LoginUser(user, password, spyCallback);
      
      //3. Verify
      assertWasErrorReturnedForUnconfirmedUser();
    
      //4. Teardown
      //Nothing to tear down
      done();
  });

  it("Valid login should return a result in a populated user object", function(done) {
      //1. Setup
      // Nothing additional to set up
      
      //2. Exercise
      ums.LoginUser(user, password, spyCallback);
      
      //3. Verify
      assertLoginHasPopulatedTheUserObject();
    
      //4. Teardown
      //Nothing to tear down
      done();
  });

  it("Should compare the password hash", function(done) {
      //1. Setup
      
      //2. Exercise
      ums.LoginUser(user, password, spyCallback);
      
      //3. Verify
      assertThePasswordIsCheckedAgainstTheHashedPassword();

      //4. Teardown
      //Nothing to tear down
      done();
  });
  
  
  it("When the password hash compare fails the caller should be notified", function(done) {

      var expectedHashError = new Error('Hash Failure');
      stubCompareCrypt.yields(expectedHashError, false);

      //2. Exercise
      ums.LoginUser(user, password, spyCallback);
      
      //3. Verify
      assertReturnErrorWhenThePasswordHashFailsForReasonsOtherThanQuality(expectedHashError);

      //4. Teardown
      //Nothing to tear down
      done();
  });
  
  it("Given the user is not registered, should return an error", function(done) {
    
    // Setup
    var expectedError = new Error('Notfound');
    stubGet.yields(expectedError, null);

    // Exercise
    ums.LoginUser(user, password, spyCallback);

    // Verify
    assertErrorReturnedWhenUserNotRegistered(expectedError);
    
    // Teardown
    // Nothing to teardown
    done();
  });
  
  it('Allows a new user to register', function(done) {
    // 1. Setup
    stubGet.yields(errorNotFound);
    
    // 2. Exercise
    ums.RegisterUser(user, password, spyCallback);
    
    // 3. Verify
    assertNewUserSuccessfullyRegistered();
    
    done();
  });
  
  it('Returns error if the registering user already exists', function(done) {
      // 1. Setup
      
      // 2. Exercise
      ums.RegisterUser(user, password, spyCallback);
      
      // 3. Verify
      assertReturnsErrorWhenUserAlreadyExists();
      
      done();
  });

  it('Enacts the hash of the password prior to saving to the database', function(done) {
      // 1. Setup
      stubGet.yields(errorNotFound);      
      
      // 2. Exercise
      ums.RegisterUser(user, password, spyCallback);
      
      // 3. Verify
      assertWasTheHashCalledPriorToRegisteringTheUserInTheDatabase();
      
      done();
  });

  it('Enacts the tokenizer to generate a token that is used to verify the user prior to saving to the database', function(done) {
      // 1. Setup
      stubGet.yields(errorNotFound);      
      
      // 2. Exercise
      ums.RegisterUser(user, password, spyCallback);
      
      // 3. Verify
      assertWasTheTokenizerCalledPriorToRegisteringTheUserInTheDatabase();
      
      done();
  });

  it('Sends the verification email upon successfully saving', function(done) {
      // 1. Setup
      stubGet.yields(errorNotFound);      

      // 2. Exercise
      ums.RegisterUser(user, password, spyCallback);
      
      // 3. Verify
      assertWasEmailSentAfterSaving();

      done();
  });

  it('Checking state (state based verification) of emailer after sending email', function(done) {
      // 1. Setup
      stubGet.yields(errorNotFound);
      evs.send.restore();

      // 2. Exercise
      ums.RegisterUser(user, password, spyCallback);
      
      // 3. Verify
      assert(evs.messageCount() == 1);
      
      done();
  });

  it('Checking state (behaviour based verification) of emailer after sending email', function(done) {
      // 1. Setup
      stubGet.yields(errorNotFound); 
      //clean up just for the test as we are using a mock
      stubSendVerifyEmail.restore();
      var mockSendVerifyEmail = sinon.mock(evs);
      mockSendVerifyEmail.expects('send').withArgs(user).once();
      
      // 2. Exercise
      ums.RegisterUser(user, password, spyCallback);
      
      // 3. Verify
      mockSendVerifyEmail.verify();
      
      //4. teardown
      mockSendVerifyEmail.restore();
      done();
  });

  it('Notifies of an error enacting emailing of verification email', function(done) {
      // 1. Setup
      stubGet.yields(errorNotFound);      
      stubSendVerifyEmail.yields(new Error('Email system failure'))
      
      // 2. Exercise
      ums.RegisterUser(user, password, spyCallback);
      
      // 3. Verify
      assertErrorReturnedOnEmailFailure();

      done();
  });
  
  it('Returns error upon hash failure', function(done) {
      // 1. Setup
      stubGet.yields(errorNotFound);     
      
      var hashError = 'Hash Error Occured';
      stubCreateCrypt.yields(new Error(hashError));
      
      // 2. Exercise
      ums.RegisterUser(user, password, spyCallback);
      
      // 3. Verify
      assertReturnsErrorWhenTheHashOfthePasswordDoesntWork(hashError);

      done();
  });
  
  it('Returns error if checking for existance of the user fails because of db failure', function(done) {
      // 1. Setup
      var message = "General Database Failure";
      stubGet.yields(new Error(message));
      
      // 2. Exercise
      ums.RegisterUser(user, password, spyCallback);
      
      // 3. Verify
      assertReturnsErrorOnGeneralDatabaseFailure(message);

      done();
  });

  it('Returns error if the registering user fails to be saved to the database', function(done) {
      // 1. Setup
      stubGet.yields(errorNotFound);      
      var errormessage = "Database access failed";
      stubPut.yields(new Error(errormessage));
      
      // 2. Exercise
      ums.RegisterUser(user, password, spyCallback);
      
      // 3. Verify
      assertReturnsErrorWhenNewUserDoesNotGetSavedToTheDatabase(errormessage);
      
      done();
  });

  it('Allows confirmation of a new user', function(done) {

    // 1. Setup
    var tokenValue = 'A token generated when the user registered - it will have a expiration as well';
    //we expect to find the user with a registration token
    var expectedValue = { password: 'hashedPassword', firstname: firstname, surname: surname, email: user, token: tokenValue};
    stubGet.yields(null, expectedValue);    
    
    // 2. Exercise
    ums.ConfirmRegisterUser(user, tokenValue, spyCallback);
      
    //3. Verify
    assertRegisteredUserIsConfirmed(expectedValue.password, expectedValue.email, tokenValue);
    done();
  });

  it('Returns error when user not longer exists prior to confirming', function(done) {

    // 1. Setup
    stubGet.yields(errorNotFound);    
    
    // 2. Exercise
    ums.ConfirmRegisterUser(user, 'not relevant', spyCallback);
      
    //3. Verify
    assertReturnsErrorOnGetForRegisteredUser(user, 'The user ' + user + ' is not present in the database');
    done();
  });

  it('Returns error on a general get failure prior to confirming', function(done) {

    // 1. Setup
    var message = "General Database Failure";
    stubGet.yields(new Error(message));  
    
    // 2. Exercise
    ums.ConfirmRegisterUser(user, 'not relevant', spyCallback);
      
    //3. Verify
    assertReturnsErrorOnGetForRegisteredUser(user, 'A failure occurred trying to retrieve details for ' + user);
    done();
  });

  it('Returns error on when saving the confirmed user fails', function(done) {

    // 1. Setup
    var errormessage = "Database access failed";
    stubPut.yields(new Error(errormessage));
    
    // 2. Exercise
    ums.ConfirmRegisterUser(user, 'not relevant', spyCallback);
      
    //3. Verify
    assertReturnsErrorOnSaveForRegisteredUser(user, 'A failure occurred trying to save confirmation for ' + user);
    done();
  });

  function assertLoginWasValidatedSuccessfully() {
      assert(spyCallback.calledOnce, 'Callback not called');
      assert(spyCallback.calledWith(undefined), 'Not expecting an error');      
  }

  function assertWasErrorReturnedForUnconfirmedUser() {
    assert(callbackCalledWithError('User has yet to be confirmed'), 'User should be confirmed prior to be allowed to log in');  
  }
  
  function assertLoginHasPopulatedTheUserObject() {
        var result = spyCallback.args[0][1];
        assert.equal(firstname, result.firstname, "firstname does not match");
        assert.equal(surname, result.surname, "surname does not match");                                                                                           			   					   
        assert.equal(user, result.email, "email does not match ");					   
        assert(result.loggedIn, "Should be Logged In"); 
        assert(result.password === undefined, 'Should not have a password returned');
  }

  function assertThePasswordIsCheckedAgainstTheHashedPassword() {
      assert(stubCompareCrypt.calledOnce, 'Hash was not compared');
  }
  
  function assertReturnErrorWhenThePasswordHashFailsForReasonsOtherThanQuality(expectedHashError) {
      assert(spyCallback.calledWith(expectedHashError), 'Expecting error in callback');
  }

  function assertNewUserSuccessfullyRegistered() {
    assert(stubPut.calledWith(user, sinon.match({ password: expectedValue.password, email: user, token: tokenGenerated })), 'put not call with required user data');
    assert(callbackCalledWithNoError(), 'Callback not called after saving the user');
  }

  function assertReturnsErrorWhenUserAlreadyExists() {
      assert(callbackCalledWithError("User already exists"), 'Error message not returned through callback');
  }

  function assertErrorReturnedWhenUserNotRegistered(expectedError)
  {
      assert(spyCallback.calledWith(expectedError), 'Expecting error in callback');
  }
  
  function assertReturnsErrorWhenNewUserDoesNotGetSavedToTheDatabase(errormessage) {
    assert(callbackCalledWithError(errormessage), 'Failed to raise error message ' + errormessage);
  }
  
  function assertReturnsErrorOnGeneralDatabaseFailure(message) {
    assert(callbackCalledWithError(message), 'Error message not returned through callback');
  }
  
  function assertReturnsErrorOnSaveForRegisteredUser(user, message) {
    assert(callbackCalledWithError(message), 'Error message not returned through callback.  Expected message is ' + message);
  }
  
  function assertReturnsErrorWhenTheHashOfthePasswordDoesntWork(error) {
      assert(callbackCalledWithError(error), 'Error message not returned through callback');
  }
  
  function assertReturnsErrorOnGetForRegisteredUser(user, message) {
    assert(callbackCalledWithError(message), 'Error message not returned through callback.  Expected message is ' + message);
  }
  
  function assertRegisteredUserIsConfirmed(password, email, tokenValue) {
    assert(stubTokenVerify.calledWith(user, tokenValue), 'Token verifier was not enacted');
    assert(stubPut.calledWith(user, sinon.match({ password: password, email: email, token: tokenValue, confirmed: true })), 'put not called with user data with confirmation flagg');
    sinon.assert.callOrder(stubTokenVerify, stubPut);
  }
  
  function assertWasTheHashCalledPriorToRegisteringTheUserInTheDatabase() {
      assert(stubCreateCrypt.calledWith(password, 10), 'Encryption not enacted with correct parameters');
      assert(stubPut.calledWith(user, sinon.match({ password: 'hashedPassword', email: user })), 'put not called with correct parameters');
      sinon.assert.callOrder(stubCreateCrypt, stubPut);
  }

  function assertWasTheTokenizerCalledPriorToRegisteringTheUserInTheDatabase() {
      assert(stubTokenGenerate.calledWith(user), 'Token not generated with email as parameter');
      assert(stubPut.calledWith(user, sinon.match({ password: 'hashedPassword', email: user })), 'put not called with correct parameters');
      sinon.assert.callOrder(stubTokenGenerate, stubPut);
  }
  
  function assertWasEmailSentAfterSaving() {
    stubSendVerifyEmail.calledWith(user, 'We did not get the expected call to the emailer');
    sinon.assert.callOrder(stubPut, stubSendVerifyEmail);
  }
  
  function assertErrorReturnedOnEmailFailure() {
    assert(callbackCalledWithError('Failed to send the verification email'), 'Email error was not returned');  
  }
  
  function callbackCalledWithNoError() {
    return spyCallback.calledWith(sinon.match.falsy);
  }
  
  function callbackCalledWithError(optionalMessage) {
    var calledWithError = spyCallback.calledWith(sinon.match.instanceOf(Error));
    var messageMatches = !optionalMessage || spyCallback.calledWith(sinon.match.has("message", optionalMessage));
    return calledWithError && messageMatches;
  }
});


