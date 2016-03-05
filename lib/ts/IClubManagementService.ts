/// <reference path='../../typings/tsd.d.ts' />

/*
*  Services for Club Management like like creating clubs and amending club information
*  @interface
**/
export interface IClubManagementService {
    CreateClub(clubname: string, fieldname: string, suburbname: string, cityname: string, adminemail: string, callback: any);
    GetClubs(adminemail: string, callback: any);
}