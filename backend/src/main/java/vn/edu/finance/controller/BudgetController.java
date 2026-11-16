package vn.edu.finance.controller;
import vn.edu.finance.service.BudgetService;
import vn.edu.finance.service.AccountService;
import java.util.*;
import jakarta.validation.Valid;
import vn.edu.finance.dto.request.BudgetCreateRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
@RestController @RequestMapping("/api/budgets") public class BudgetController {
 private final BudgetService f; private final AccountService account; public BudgetController(BudgetService f,AccountService account){this.f=f;this.account=account;}
 @GetMapping public Object list(@AuthenticationPrincipal OidcUser u){return f.list(account.user(u));}
 @ResponseStatus(HttpStatus.CREATED) @PostMapping public Object create(@AuthenticationPrincipal OidcUser u,@RequestBody Map<String,Object>b){long uid=account.user(u);f.save(uid,null,b);return f.list(uid);}
 @PutMapping("/{id}") public Object edit(@AuthenticationPrincipal OidcUser u,@PathVariable long id,@RequestBody Map<String,Object>b){long uid=account.user(u);f.save(uid,id,b);return f.list(uid);}
 @DeleteMapping("/{id}") public Object delete(@AuthenticationPrincipal OidcUser u,@PathVariable long id){f.delete(account.user(u),id);return Map.of("deleted",true);}
 @GetMapping("/{id}/items") public Object items(@AuthenticationPrincipal OidcUser u,@PathVariable long id){return f.budgetItems(account.user(u),id);}
 @PostMapping("/{id}/items") public Object addItem(@AuthenticationPrincipal OidcUser u,@PathVariable long id,@RequestBody Map<String,Object>b){long uid=account.user(u);f.addBudgetItem(uid,id,b);return f.budgetItems(uid,id);}
 @PutMapping("/{id}/items/{itemId}") public Object updateItem(@AuthenticationPrincipal OidcUser u,@PathVariable long id,@PathVariable long itemId,@RequestBody Map<String,Object>b){long uid=account.user(u);f.updateBudgetItem(uid,id,itemId,b);return f.budgetItems(uid,id);}
 @DeleteMapping("/{id}/items/{itemId}") public Object removeItem(@AuthenticationPrincipal OidcUser u,@PathVariable long id,@PathVariable long itemId){f.deleteBudgetItem(account.user(u),id,itemId);return Map.of("deleted",true);}
 @PutMapping("/{id}/plan") public Object plan(@AuthenticationPrincipal OidcUser u,@PathVariable long id,@RequestBody Map<String,Object>b){return f.updatePlan(account.user(u),id,b);}
 @GetMapping("/{id}/tracking") public Object tracking(@AuthenticationPrincipal OidcUser u,@PathVariable long id){return f.budgetTracking(account.user(u),id);}
 @ResponseStatus(HttpStatus.CREATED) @PostMapping("/with-items") public Object createWithItems(@AuthenticationPrincipal OidcUser u,@Valid @RequestBody BudgetCreateRequest b){return f.createBudgetWithItems(account.user(u),b);}
}
