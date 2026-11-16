package vn.edu.finance.controller;
import vn.edu.finance.service.ScenarioService;
import vn.edu.finance.service.AccountService;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
@RestController @RequestMapping("/api/scenarios") public class ScenarioController {
 private final ScenarioService f; private final AccountService account; public ScenarioController(ScenarioService f,AccountService account){this.f=f;this.account=account;}
 @GetMapping public Object list(@AuthenticationPrincipal OidcUser u){return f.list(account.user(u));}
 @ResponseStatus(HttpStatus.CREATED) @PostMapping public Object create(@AuthenticationPrincipal OidcUser u,@RequestBody Map<String,Object>b){long uid=account.user(u);f.save(uid,null,b);return f.list(uid);}
 @PutMapping("/{id}") public Object edit(@AuthenticationPrincipal OidcUser u,@PathVariable long id,@RequestBody Map<String,Object>b){long uid=account.user(u);f.save(uid,id,b);return f.list(uid);}
 @DeleteMapping("/{id}") public Object delete(@AuthenticationPrincipal OidcUser u,@PathVariable long id){f.delete(account.user(u),id);return Map.of("deleted",true);}
 @PostMapping("/{id}/simulate") public Object simulate(@AuthenticationPrincipal OidcUser u,@PathVariable long id){return f.simulate(account.user(u),id);}
 @PostMapping("/compare") public Object compare(@AuthenticationPrincipal OidcUser u,@RequestBody List<Long> ids){return f.compare(account.user(u),ids);}
}
