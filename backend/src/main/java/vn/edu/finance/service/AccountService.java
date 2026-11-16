package vn.edu.finance.service;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
@Service public class AccountService {
 private final JdbcTemplate db;
 public AccountService(JdbcTemplate db){this.db=db;}
 @Transactional public long user(OidcUser u){
  if(u==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
  String sub=u.getIssuer().toString()+"|"+u.getSubject();
  List<Long> ids=db.queryForList("SELECT user_id FROM dbo.users WHERE oidc_subject=?",Long.class,sub);
  if(!ids.isEmpty())return ids.get(0);
  try{db.update("INSERT INTO dbo.users(oidc_subject,email,display_name) VALUES(?,?,?)",sub,Objects.toString(u.getEmail(),""),Objects.toString(u.getFullName(),"Người dùng"));}
  catch(org.springframework.dao.DuplicateKeyException e){/* Concurrent first login: look up row. */}
  return db.queryForObject("SELECT user_id FROM dbo.users WHERE oidc_subject=?",Long.class,sub);
 }
 public Map<String,Object> profile(long uid){return db.queryForMap("SELECT user_id,email,display_name FROM dbo.users WHERE user_id=?",uid);}
 public void profile(long uid,Map<String,Object> b){String name=Objects.toString(b.get("display_name"),"").trim();if(name.isBlank()||name.length()>120)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Tên hiển thị phải có 1–120 ký tự");db.update("UPDATE dbo.users SET display_name=? WHERE user_id=?",name,uid);}
}
