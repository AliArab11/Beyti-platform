using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("UserMembership")]
[Index("MembershipPlanId", Name = "IX_UserMembership_Plan")]
[Index("UserProfileId", Name = "IX_UserMembership_User")]
public partial class UserMembership
{
    [Key]
    public int Id { get; set; }

    public int UserProfileId { get; set; }

    public int MembershipPlanId { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    [StringLength(20)]
    public string Status { get; set; } = null!;

    public bool AutoRenew { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [ForeignKey("MembershipPlanId")]
    [InverseProperty("UserMemberships")]
    public virtual MembershipPlan MembershipPlan { get; set; } = null!;

    [ForeignKey("UserProfileId")]
    [InverseProperty("UserMemberships")]
    public virtual UserProfile UserProfile { get; set; } = null!;
}
