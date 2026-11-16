package vn.edu.finance.controller;
import vn.edu.finance.service.SampleDataService;
import vn.edu.finance.service.AccountService;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
@RestController @RequestMapping("/api/data") public class SampleDataController {
 private final SampleDataService f; private final AccountService account; public SampleDataController(SampleDataService f,AccountService account){this.f=f;this.account=account;}
 @GetMapping("/sample-summary") public Object summary(@AuthenticationPrincipal OidcUser u){return f.preview(account.user(u));}
 @PostMapping("/sample") public Object sample(@AuthenticationPrincipal OidcUser u){f.sample(account.user(u));return Map.of("created",true);}
 @DeleteMapping("/sample") public Object removeSamples(@AuthenticationPrincipal OidcUser u){f.deleteData(account.user(u),true);return Map.of("deleted",true);}
 @DeleteMapping("/personal") public Object removePersonal(@AuthenticationPrincipal OidcUser u){f.deleteData(account.user(u),false);return Map.of("deleted",true);}
}
