package vn.edu.finance.controller;

import vn.edu.finance.service.GoalService;
import vn.edu.finance.service.AccountService;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestController
@RequestMapping("/api/goals")
public class GoalController {
    private final GoalService f;
    private final AccountService account;

    public GoalController(GoalService f, AccountService account) {
        this.f = f;
        this.account = account;
    }

    @GetMapping
    public Object list(@AuthenticationPrincipal OidcUser u) {
        return f.list(account.user(u));
    }

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public Object create(@AuthenticationPrincipal OidcUser u, @RequestBody Map<String, Object> b) {
        long uid = account.user(u);
        f.save(uid, null, b);
        return f.list(uid);
    }

    @PutMapping("/{id}")
    public Object edit(@AuthenticationPrincipal OidcUser u, @PathVariable long id, @RequestBody Map<String, Object> b) {
        long uid = account.user(u);
        f.save(uid, id, b);
        return f.list(uid);
    }

    @DeleteMapping("/{id}")
    public Object delete(@AuthenticationPrincipal OidcUser u, @PathVariable long id) {
        f.delete(account.user(u), id);
        return Map.of("deleted", true);
    }

    @GetMapping("/{id}/contributions")
    public Object contributions(@AuthenticationPrincipal OidcUser u, @PathVariable long id) {
        return f.contributions(account.user(u), id);
    }

    @PostMapping("/{id}/contributions")
    public Object add(@AuthenticationPrincipal OidcUser u, @PathVariable long id, @RequestBody Map<String, Object> b) {
        long uid = account.user(u);
        f.addContribution(uid, id, b);
        return f.contributions(uid, id);
    }

    @PutMapping("/{id}/contributions/{itemId}")
    public Object update(@AuthenticationPrincipal OidcUser u, @PathVariable long id, @PathVariable long itemId,
            @RequestBody Map<String, Object> b) {
        long uid = account.user(u);
        f.updateContribution(uid, id, itemId, b);
        return f.contributions(uid, id);
    }

    @DeleteMapping("/{id}/contributions/{itemId}")
    public Object remove(@AuthenticationPrincipal OidcUser u, @PathVariable long id, @PathVariable long itemId) {
        f.deleteContribution(account.user(u), id, itemId);
        return Map.of("deleted", true);
    }

    @GetMapping("/{id}/tracking")
    public Object tracking(@AuthenticationPrincipal OidcUser u, @PathVariable long id) {
        return f.goalTracking(account.user(u), id);
    }
}
