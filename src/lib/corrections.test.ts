import {describe,expect,it} from 'vitest';
import {availableVoiceStyles,accessibleVoiceStyle} from './voices';
import {orderedPackages,whatsappUpgradeUrl,launchPackages,billing} from './plans';

describe('package upgrade and voice entitlement corrections',()=>{
  it('orders Basic then Plus without mutating server data',()=>{
    const reversed=[launchPackages[1],launchPackages[0]];
    expect(orderedPackages(reversed).map(p=>p.id)).toEqual(['basic','plus']);
    expect(reversed[0].id).toBe('plus');
  });
  it.each([null,'basic'] as const)('hides and safely ignores a saved mixed panel for %s',premium=>{
    expect(availableVoiceStyles(premium).map(option=>option.value)).toEqual(['male','female','soft','deep']);
    expect(accessibleVoiceStyle('mixed',premium)).toBe('female');
    expect(accessibleVoiceStyle('deep',premium)).toBe('deep');
  });
  it('preserves all five voice styles and mixed simulation for Plus',()=>{
    expect(availableVoiceStyles('plus').map(option=>option.value)).toEqual(['mixed','male','female','soft','deep']);
    expect(accessibleVoiceStyle('mixed','plus')).toBe('mixed');
  });
  it.each(launchPackages)('links the selected $id package and approved business phone without customer data',selected=>{
    const contaminated={...selected,email:'private@example.test',user_id:'private-uuid',access_token:'private-token',answer:'private-answer'};
    const link=whatsappUpgradeUrl('255688010595',contaminated)!;
    const url=new URL(link);
    expect(url.origin).toBe('https://wa.me'); expect(url.pathname).toBe('/255688010595');
    expect([...url.searchParams.keys()]).toEqual(['text']);
    expect(url.searchParams.get('text')).toBe(`Hello KaziCoach TZ, I would like Premium ${selected.id==='plus'?'Plus':'Basic'} (TSh ${selected.price_tzs.toLocaleString('en-TZ')} for ${selected.duration_days} days). Please share payment and activation instructions.`);
    expect(decodeURIComponent(link)).not.toMatch(/private|email|user_id|access_token|answer/);
    expect(billing.enabled).toBe(false);
  });
  it('reflects admin-edited package terms instead of stale hardcoded prices',()=>{
    const link=whatsappUpgradeUrl('255688010595',{...launchPackages[0],price_tzs:4000,duration_days:10})!;
    expect(new URL(link).searchParams.get('text')).toContain('TSh 4,000 for 10 days');
  });
  it.each(['','+255688010595','255688010595?text=leak','javascript:alert(1)'])('fails closed for invalid contact %s',phone=>{
    expect(whatsappUpgradeUrl(phone,launchPackages[0])).toBeNull();
  });
});
