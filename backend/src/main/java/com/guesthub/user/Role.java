package com.guesthub.user;

public enum Role {
    OWNER,   // full control, cannot be removed (Ontiretse B. in your Figma)
    ADMIN,   // can manage guesthouses
    CONSUMER // app user: favourites + ratings
}
