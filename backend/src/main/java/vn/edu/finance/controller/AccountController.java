package vn.edu.finance.controller;
import vn.edu.finance.service.AccountService;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
@RestController @RequestMapping("/api") public class AccountController {
 private final AccountService f; public AccountController(AccountService f){this.f=f;}
 @GetMapping("/csrf") public Map<String,String> csrf(org.springframework.security.web.csrf.CsrfToken token){return Map.of("headerName",token.getHeaderName(),"token",token.getToken());}
 @GetMapping("/session") public Map<String,Object> session(@AuthenticationPrincipal OidcUser u){
  if(u==null) return Map.of("authenticated",false);
  return Map.of("authenticated",true,"profile",f.profile(f.user(u)));
 }
 @GetMapping("/me") public Map<String,Object> me(@AuthenticationPrincipal OidcUser u){return f.profile(f.user(u));}
 @PutMapping("/profile") public Map<String,Object> profile(@AuthenticationPrincipal OidcUser u,@RequestBody Map<String,Object>b){long uid=f.user(u);f.profile(uid,b);return f.profile(uid);}
}
