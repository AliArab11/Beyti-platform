using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti.Data;

[Table("MembershipPlan")]
public partial class MembershipPlan
{
    [Key]
    public int Id { get; set; }

    [StringLength(50)]
    public string Name { get; set; } = null!;

    [StringLength(255)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal MonthlyPrice { get; set; }

    public int? DurationDays { get; set; }

    public bool IsActive { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [InverseProperty("MembershipPlan")]
    public virtual ICollection<UserMembership> UserMemberships { get; set; } = new List<UserMembership>();
}
