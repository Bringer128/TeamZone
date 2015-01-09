Feature:  Register as a user on TeamZone with an email address and password
Our users (e.g. Coaches, Players, Admins, Managers, Vote Givers) will need to register on the site in order to do tasks that normal viewers of the site can't do like
setup teams, add players and give votes.

Background:

	Given We visit the register user page on the site. 
	
# Note for this scenario we will not be using a real mail server as it would be too slow and prone to error
# Therefore the email sending is tested manually.  The verification of the url is handled via VerifyNewUserEmailAddress.feature at the feature level
#
Scenario: The administrator Mary Kovacs wants to register on the website. She will need to eventually be able to setup teams and add players.

# Potentially duplicate with Background given?
	Given We are on the register user page and choose to register with an email and a password
	When I enter marykovacs@aboutagile.com into the email field and GoKnights in the password field and click the Register button
	Then Mary Kovacs will be sent a validation email.  No other details are required until the email is validated.

# Uncomment and see if this is working?
##Scenario: The administrator Mary Kovacs is already registered on the website so should not be able to register again
##
##  # Duplicated with above step - can 'refactor' into a Background step?
##	Given We are on on the register as a user page and choose to register with an email and a password
##	When I enter marykovacs@aboutagile.com into the email field and GoKnights in the password field and click the Register button
##	Then Mary Kovacs will be told that she is already registered.  She should be told to use the login button on the home page to login
	
## Student's could work on the other scenarios we come up with or tey come up with ?
##
